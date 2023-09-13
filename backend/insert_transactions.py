#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# insert_transactions.py: This file takes a batch of transactions in a JSON
# file and inserts them into the database
#

# System imports
import sys
import argparse
import os
import json
import logging
from typing import List, Dict
from difflib import get_close_matches

# Local imports
from model import Transaction
from database import Database


TxnMapType = Dict[str, Dict[str, Dict[float, Dict[str, List[int]]]]]


def build_txn_map(transactions: List[Transaction]) -> TxnMapType:
    '''
    Converts a list of transactions to a map of:
        source -> date -> amount -> description -> count

    Args:
        transactions:   The list of transactions

    Returns:
        the mapping of transactions
    '''
    txn_map: Dict = {}
    for txn in transactions:
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
    existing_txn_map = build_txn_map(db.get_all_transactions())

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
            logging.info('Updated existing transaction: %d, %s, %s, %s, "%s" -> "%s"', match.id, txn.source, txn.date, txn.amount, match.description, txn.description)
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
    '''
    transactions = prune_existing_transactions(transactions, db)

    # Any remaining new transactions are indeed new and need to be inserted
    for txn in transactions:
        new_txn = db.add_transaction(txn)
        logging.info('Inserted new transaction: %d, %s, %s, %s, "%s"', new_txn.id, new_txn.source, new_txn.date, new_txn.amount, new_txn.description)


def parse_args() -> List[Dict]:  # pragma: no cover
    '''
    Defines arguments to be parsed from the command line.
    '''
    parser = argparse.ArgumentParser(description='Process a list of transactions and insert into the database')
    parser.add_argument('--transactions', required=True, help='Path to the JSON transaction list')
    parser.add_argument('--log-file', required=True, help='Path to the log file')

    args = parser.parse_args()

    if not os.path.isfile(args.transactions):
        parser.error('--transactions JSON file must exist')

    logging.basicConfig(filename=args.log_file,
                        filemode='a',
                        format='%(asctime)s | %(levelname)-8s | %(message)s',
                        datefmt='%Y/%m/%d %H:%M:%S',
                        level=logging.DEBUG)

    try:
        with open(args.transactions) as fp:
            return json.load(fp)['transactions']
    except:
        parser.error('--transactions JSON file must contain valid JSON')


def main():  # pragma: no cover
    '''
    The main function

    Returns:
        code to use as the exit status
    '''
    transactions = parse_args()
    db = Database()

    with db:
        logging.info('Processing %d transactions', len(transactions))
        insert_transactions([Transaction(**txn) for txn in transactions], db)
        logging.info('Complete')

    return 0


if __name__ == '__main__':  # pragma: no cover
    sys.exit(main())
