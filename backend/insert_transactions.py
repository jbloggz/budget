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
from pywebpush import webpush, WebPushException

# Local imports
from model import Transaction, TransactionList
from database import Database


TxnMapType = Dict[str, Dict[str, Dict[float, Dict[str, List[int]]]]]


def send_push_notification(body: Dict, config, db) -> None:  # pragma: no cover
    '''
    Send a push notification

    Args:
        body:    The body of the notification to send
    '''
    for sub in db.get_push_subscriptions():
        try:
            webpush(subscription_info=sub.value, data=json.dumps(body),
                    vapid_private_key=config['vapidPrivateKey'], vapid_claims=config['vapidClaims'])
        except WebPushException as exc:
            logging.info(f'Cannot send push notification for {json.dumps(sub.value)}: {exc}')
            db.delete_push_subscription(sub.id)


def run_scraper(args, config: Dict, scraper: Dict) -> List[Transaction]:  # pragma: no cover
    '''
    Run a scraper file

    Args:
        args:    Command line arguments
        config:  Configuration data
        scraper: The scraper configuration

    Returns:
        The list of transactions
    '''
    result = subprocess.run([config['node_path'], './scrapers/' + scraper['path'], args.config],
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, encoding='utf-8', check=True)
    if result.stdout is None:
        return []

    data = json.loads(result.stdout)

    return [Transaction(**txn) for txn in data['transactions'] if txn['date'] >= scraper['start_date']]


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


def insert_transactions(transactions: List[Transaction], db) -> int:
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

    return len(transactions)


def update_balance(name: str, start_balance: int, db):
    '''
    Update balance of all transactions

    Args:
        name: The name of the source
        start_balance: The starting balance for the source
        db: The database object
    '''
    logging.info('Updating balances')

    running_total = start_balance
    txn_list = db.get_transaction_list('txn.source = ? ORDER BY date ASC, id ASC', (name,))
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
    parser.add_argument('--config', required=True, help='Path to the budget config file')
    parser.add_argument('--balance', action='store_true', help='Only update the balances, don\'t run the scrapers')
    parser.add_argument('--notification', help='Send a test push notification')

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
    with open(args.config) as fp:
        config = json.load(fp)

    with Database() as db:
        if args.notification:
            send_push_notification(json.loads(args.notification), config, db)
            return

        count = 0
        for name, scraper in config['scrapers'].items():
            if not args.balance:
                count += insert_transactions(run_scraper(args, config, scraper), db)
            update_balance(name, scraper.get('start_balance', 0), db)

        if count > 0:
            # Send push notifications if new transactions were found
            send_push_notification({
                'type': 'new_transactions',
                'count': count,
            }, config, db)

    return 0


if __name__ == '__main__':  # pragma: no cover
    try:
        sys.exit(main(parse_args()))
    except Exception as exc:
        logging.exception(exc, exc_info=True)
