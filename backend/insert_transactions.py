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
import datetime
from typing import List, Dict, Tuple
from difflib import get_close_matches

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

    content = json.dumps(body)
    for sub in db.get_push_subscriptions():
        try:
            sub_value = json.dumps(sub.value)

            # Create and call a node script to do the notification push
            script = f'''const webpush = require('web-push');
webpush.setGCMAPIKey(`{config['GCMAPIKey']}`);
webpush.setVapidDetails(`{config['vapidSub']}`, `{config['vapidPublicKey']}`, `{config['vapidPrivateKey']}`);
webpush.sendNotification({sub_value}, `{content}`);
'''
            subprocess.run([config['node_path'], '-e', script], stdout=subprocess.PIPE, stderr=subprocess.PIPE, encoding='utf-8', check=True)
            logging.info(f'Sent push notification for {sub_value}')
        except Exception as exc:
            logging.info(f'Cannot send push notification for {sub_value}: {exc}')
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

    logging.debug(result.stdout)
    data = json.loads(result.stdout)

    return [Transaction(**txn) for txn in data['transactions'] if txn['date'] >= scraper['start_date']]


def prune_existing_transactions(transactions: List[Transaction], source: str, db, min_date: str = None) -> Tuple[List[Transaction], List[Transaction]]:
    '''
    Prune existing transactions from the list of new transactions

    Args:
        transactions:  New transaction list
        source: The source of the transactions
        db: The database object

    Returns:
        A tuple of the transactions to insert and delete
    '''
    if min_date:
        # Only get transactions since min_date
        existing_transactions = db.get_transaction_list('date >= ? AND source = ?', (min_date, source)).transactions
        transactions = [txn for txn in transactions if txn.date >= min_date]
        logging.info(f'There are {len(transactions)} transactions to process from {min_date} to now')
        logging.info(f'There are {len(existing_transactions)} existing transactions from {min_date} to now')
    else:
        existing_transactions = db.get_transaction_list('source = ?', (source, )).transactions

    # Prune any exact matches
    for txn in transactions:
        for i, existing_txn in enumerate(existing_transactions):
            if txn.date == existing_txn.date and txn.amount == existing_txn.amount and txn.description == existing_txn.description and txn.pending == existing_txn.pending:
                # Found a match
                txn.id = existing_txn.id
                logging.info(f'Pruning existing transaction: {txn.id}, {txn.source}, {txn.date}, {txn.amount}, {txn.description}, {txn.pending}')
                existing_transactions.pop(i)
                break

    logging.info(
        f'There are {len([txn for txn in existing_transactions if txn.pending])} existing pending transactions which don\'t exactly match a new transaction')
    logging.info(
        f'There are {len([txn for txn in existing_transactions if not txn.pending])} existing posted transactions which don\'t exactly match a new transaction')
    if not existing_transactions:
        # All existing transactions accounted for, so any remaining new ones need to be inserted
        return [txn for txn in transactions if not txn.id], []

    # Assume pending transactions don't change, so any left over need to be inserted
    new_pending_transactions = [txn for txn in transactions if txn.pending and not txn.id]
    if new_pending_transactions:
        logging.info(f'Found {len(new_pending_transactions)} new pending transactions')

    # Any existing posted transaction that are leftover are likely a problem, but
    # we don't want to remove them, so flag them
    for txn in existing_transactions:
        if not txn.pending:
            logging.info(f'WARNING: Existing posted transaction is missing from new transactions: {txn.id}, {txn.source}, {txn.date}, {txn.amount}, {txn.description}')

    # Get the remaining posted transactions and pending existing transactions
    transactions = [txn for txn in transactions if not txn.pending and not txn.id]
    existing_transactions = [txn for txn in existing_transactions if txn.pending]
    if transactions:
        logging.info(f'Found {len(transactions)} posted transactions that are either new or need to replace a pending transaction')

    # Match up new posted transactions with existing pending transactions that match exactly
    for txn in transactions:
        for i, existing_txn in enumerate(existing_transactions):
            if txn.date == existing_txn.date and txn.amount == existing_txn.amount and txn.description == existing_txn.description:
                txn.id = existing_txn.id
                db.update_transaction(txn.id, txn)
                logging.info(f'Pending transaction posted with exact match: {txn.id}, {txn.source}, {txn.date}, {txn.amount}, {txn.description}')
                existing_transactions.pop(i)
                break

    # Clear any matched transactions
    transactions = [txn for txn in transactions if not txn.id]

    # Match up new posted transactions with existing pending transactions on the same day with modified description
    for txn in transactions:
        descr_map = {txn.description.lower(): (i, existing_txn) for i, existing_txn in enumerate(existing_transactions)
                     if existing_txn.amount == txn.amount and existing_txn.date == txn.date}
        matches = get_close_matches(txn.description.lower(), descr_map.keys(), cutoff=0.75)
        if matches:
            i, existing_txn = descr_map[matches[0]]
            txn.id = existing_txn.id
            db.update_transaction(txn.id, txn)
            logging.info(f'Pending transaction posted with same day partial match: {txn.id}, {txn.source}, {txn.date}, {txn.amount}, {existing_txn.description} -> {txn.description}')
            existing_transactions.pop(i)

    # Clear any matched transactions
    transactions = [txn for txn in transactions if not txn.id]

    # Match up new posted transactions with existing pending transactions on a different day with same description
    for txn in transactions:
        for i, existing_txn in enumerate(existing_transactions):
            if txn.amount == existing_txn.amount and txn.description == existing_txn.description:
                txn.id = existing_txn.id
                db.update_transaction(txn.id, txn)
                logging.info(f'Pending transaction posted with different day exact match: {txn.id}, {txn.source}, {existing_txn.date} -> {txn.date}, {txn.amount}, {txn.description}')
                existing_transactions.pop(i)
                break

    # Clear any matched transactions
    transactions = [txn for txn in transactions if not txn.id]

    # Match up new posted transactions with existing pending transactions on a different day with modified description
    for txn in transactions:
        descr_map = {txn.description.lower(): existing_txn for existing_txn in existing_transactions
                     if existing_txn.amount == txn.amount}
        matches = get_close_matches(txn.description.lower(), descr_map.keys(), cutoff=0.75)
        if matches:
            existing_txn = descr_map[matches[0]]
            txn.id = existing_txn.id
            db.update_transaction(txn.id, txn)
            logging.info(f'Pending transaction posted with different day partial match: {txn.id}, {txn.source}, {existing_txn.date} -> {txn.date}, {txn.amount}, {existing_txn.description} -> {txn.description}')
            existing_transactions.pop(i)
            break

    # Clear any matched transactions
    transactions = [txn for txn in transactions if not txn.id]

    to_insert = transactions + new_pending_transactions
    to_delete = existing_transactions

    return to_insert, to_delete


def process_transactions(transactions: List[Transaction], source: str, db, min_date: str = None) -> int:
    '''
    Inserts transactions into the database

    Args:
        transactions: The list of transactions to insert
        source: The source of the transactions
        db: The database object
        min_date: Ignore all transactions before this date
    '''
    logging.info(f'Processing {len(transactions)} transactions')
    to_insert, to_delete = prune_existing_transactions(transactions, source, db, min_date)

    for txn in to_insert:
        new_txn = db.add_transaction(txn)
        logging.info(f'Inserted new transaction: {new_txn.id}, {new_txn.source}, {new_txn.date}, {new_txn.amount}, {new_txn.description}, {new_txn.pending}')

    db.delete_transactions([txn.id for txn in to_delete])
    for txn in to_delete:
        logging.info(f'Deleted pending transaction: {txn.id}, {txn.source}, {txn.date}, {txn.amount}, {txn.description}')

    logging.info('Completed processing transactions')

    return len(transactions)


def parse_args():  # pragma: no cover
    '''
    Defines arguments to be parsed from the command line.
    '''
    parser = argparse.ArgumentParser(description='Process a list of transactions and insert into the database')
    parser.add_argument('--log',     required=True, help='Path to the log file')
    parser.add_argument('--config', required=True, help='Path to the budget config file')
    parser.add_argument('--balance', action='store_true', help='Only update the balances, don\'t run the scrapers')
    parser.add_argument('--notification', help='Send a test push notification')
    parser.add_argument('--replay-path', help='Path to file with raw transactions to replay, one set per line')
    parser.add_argument('--lastx-days', type=int, default=10, help='Only process transactions from the lastx days')

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

        min_date = (datetime.date.today() - datetime.timedelta(days=args.lastx_days)).strftime('%Y-%m-%d')

        if args.replay_path:
            with open(args.replay_path) as fp:
                lines = fp.readlines()
                for line in lines:
                    logging.debug(line.strip())
                    transactions = json.loads(line)
                    source = transactions['transactions'][0]['source']
                    scraper = config['scrapers'][source]
                    if transactions['transactions']:
                        txn_list = [Transaction(**txn) for txn in transactions['transactions'] if txn['date'] >= scraper['start_date']]
                        count += process_transactions(txn_list, source, db, min_date)
                        db.update_balance(source, scraper['start_balance'])
        else:
            for name, scraper in config['scrapers'].items():
                if not args.balance:
                    count += process_transactions(run_scraper(args, config, scraper), name, db, min_date)
                db.update_balance(name, scraper['start_balance'])

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
