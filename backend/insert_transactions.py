#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# insert_transactions.py: This file processes the scrapers and inserts the
# transactions into the database
#

# System imports
import sys
import argparse
import json
import subprocess
import logging
from typing import List, Dict
from difflib import get_close_matches

# Local imports
from model import Transaction, TransactionList
from database import Database


TxnMapType = Dict[str, Dict[str, Dict[float, Dict[str, List[int]]]]]


def run_scraper(node: str, secrets: str, path: str) -> List[Transaction]:  # pragma: no cover
    '''
    Run a scraper file

    Args:
        node:    path to the node binary
        secrets: path to the secrets file
        path:    the scraper JS file

    Returns:
        The list of transactions
    '''
    result = subprocess.run([node, './scrapers/' + path, secrets], stdout=subprocess.PIPE, stderr=subprocess.PIPE, encoding='utf-8', check=True)
    if result.stdout is None:
        return []

    data = json.loads(result.stdout)

    return [Transaction(**txn) for txn in data['transactions']]


def build_txn_map(txn_list: TransactionList) -> TxnMapType:
    '''
    Converts a list of transactions to a map of:
        source -> date -> amount -> description -> count

    Args:
        transactions:   The list of transactions

    Returns:
        the mapping of transactions
    '''
    txn_map: Dict = {}
    for txn in txn_list.transactions:
        if txn.source not in txn_map:
            txn_map[txn.source] = {}
        if txn.date not in txn_map[txn.source]:
            txn_map[txn.source][txn.date] = {}
        if txn.amount not in txn_map[txn.source][txn.date]:
            txn_map[txn.source][txn.date][txn.amount] = {}
        if txn.description not in txn_map[txn.source][txn.date][txn.amount]:
            txn_map[txn.source][txn.date][txn.amount][txn.description] = []
        txn_map[txn.source][txn.date][txn.amount][txn.description].append(txn.id)
    return txn_map


def prune_existing_transactions(transactions: List[Transaction], db) -> List[Transaction]:
    '''
    Prune existing transactions from the list of new transactions

    Args:
        transactions:  New transaction list

    Returns:
        The remaining transactions after pruning
    '''
    existing_txn_map = build_txn_map(db.get_transaction_list())

    # First prune any exact matches
    for txn in transactions:
        try:
            amount_entry = existing_txn_map[txn.source][txn.date][txn.amount]
            if amount_entry[txn.description]:
                existing_id = amount_entry[txn.description].pop()
                logging.info('Pruning existing transaction: %d, %s, %s, %s, "%s"', existing_id, txn.source, txn.date, txn.amount, txn.description)
                txn.date = ''
        except:
            # Entry not found, so ignore
            pass

    transactions = [txn for txn in transactions if txn.date]

    # Now check for matching entries with a slightly changed description.
    # Pending credit card transactions can do this sometimes when they are posted
    for txn in transactions:
        match = find_matching_transaction(txn, existing_txn_map)
        if match is not None:
            # Found a match, update the existing transaction
            db.update_transaction(match.id, txn)
            logging.info('Updated existing transaction: %d, %s, %s, %s, "%s" -> "%s"', match.id,
                         txn.source, txn.date, txn.amount, match.description, txn.description)
            txn.date = ''

    # Anything leftover must be a new transaction
    return [txn for txn in transactions if txn.date]


def find_matching_transaction(txn: Transaction, txn_map: TxnMapType):
    '''
    Find the new transaction that closest matches

    Args:
        txn:     The transaction to find
        txn_map: Existing transaction map
    '''
    try:
        entries = txn_map[txn.source][txn.date][txn.amount]
        possible_descriptions = [key for key, arr in entries.items() if arr]
        matches = get_close_matches(txn.description, possible_descriptions, cutoff=0.75)
        if not matches:
            return None
        return Transaction(
            id=entries[matches[0]].pop(),
            source=txn.source,
            date=txn.date,
            amount=txn.amount,
            description=matches[0]
        )
    except:
        return None


def insert_transactions(transactions: List[Transaction], db):
    '''
    Inserts transactions into the database

    Args:
        transactions: The list of transactions to insert
        db: The database object
    '''
    logging.info('Processing %d transactions', len(transactions))
    transactions = prune_existing_transactions(transactions, db)

    # Any remaining new transactions are indeed new and need to be inserted
    for txn in transactions:
        new_txn = db.add_transaction(txn)
        logging.info('Inserted new transaction: %d, %s, %s, %s, "%s"', new_txn.id, new_txn.source, new_txn.date, new_txn.amount, new_txn.description)

    logging.info('Completed inserting transactions')


def update_balance(name: str, initial_balance: int, db):
    '''
    Update balance of all transactions

    Args:
        name: Te name of the source
        initial_balance: The starting balance for the source
        db: The database object
    '''
    logging.info('Updating balances')

    running_total = initial_balance
    txn_list = db.get_transaction_list('txn.source = ? ORDER BY date ASC, amount ASC, description ASC, id ASC', (name,))
    for txn in txn_list.transactions:
        running_total += txn.amount
        old_balance = txn.balance
        if txn.balance != running_total:
            txn.balance = running_total
            db.update_transaction(txn.id, txn)
            logging.info('Updated balance of transaction: %d, %s, %s, %s, "%s", %d -> %d', txn.id,
                         txn.source, txn.date, txn.amount, txn.description, old_balance, txn.balance)

    logging.info('Completed updating balances')


def parse_args():  # pragma: no cover
    '''
    Defines arguments to be parsed from the command line.
    '''
    parser = argparse.ArgumentParser(description='Process a list of transactions and insert into the database')
    parser.add_argument('--log',     required=True, help='Path to the log file')
    parser.add_argument('--node',    required=True, help='Path to node binary')
    parser.add_argument('--secrets', required=True, help='Path to the secrets file')

    args = parser.parse_args()

    logging.basicConfig(filename=args.log,
                        filemode='a',
                        format='%(asctime)s | %(levelname)-8s | %(message)s',
                        datefmt='%Y/%m/%d %H:%M:%S',
                        level=logging.DEBUG)

    return args


def main(args):  # pragma: no cover
    '''
    The main function

    Returns:
        code to use as the exit status
    '''
    with open(args.secrets) as fp:
        secrets = json.load(fp)

    with Database() as db:
        for name, scraper in secrets['scrapers'].items():
            insert_transactions(run_scraper(args.node, args.secrets, scraper['path']), db)
            update_balance(name, scraper.get('initial_balance', 0), db)

    return 0


if __name__ == '__main__':  # pragma: no cover
    try:
        sys.exit(main(parse_args()))
    except Exception as exc:
        logging.exception(exc, exc_info=True)
