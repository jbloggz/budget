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
from typing import List, Dict
from difflib import get_close_matches

# Local imports
from model import Transaction
from database import Database

TxnMapType = Dict[str, Dict[str, Dict[float, Dict[str, int]]]]


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
            txn_map[txn.source][txn.date][txn.amount][txn.description] = 0
        txn_map[txn.source][txn.date][txn.amount][txn.description] += 1
    return txn_map


def prune_existing_transactions(txn_map: TxnMapType, existing_transactions: List[Transaction]) -> List[Transaction]:
    '''
    Prune existing transactions that are in both the new and existing lists

    Args:
        txn_map:                New transaction map
        existing_transactions:  Existing transaction list

    Returns:
        The remaining existing transactions after pruning
    '''
    for txn in existing_transactions:
        try:
            amount_entry = txn_map[txn.source][txn.date][txn.amount]
            if amount_entry[txn.description] > 0:
                amount_entry[txn.description] -= 1
                txn.id = None
        except:
            # Entry not found, so ignore
            pass

    return [txn for txn in existing_transactions if txn.id is not None]


def find_matching_transaction(txn: Transaction, txn_map: TxnMapType):
    '''
    Find the new transaction that closest matches

    Args:
        txn:     The transaction to find
        txn_map: New transaction map
    '''
    try:
        entries = txn_map[txn.source][txn.date][txn.amount]
        possible_descriptions = [key for key, val in entries.items() if val > 0]
        matches = get_close_matches(txn.description, possible_descriptions, cutoff=0.75)
        if not matches:
            return None
        entries[matches[0]] -= 1
        return Transaction(
            id=txn.id,
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
    txn_map = build_txn_map(transactions)
    existing_transactions = prune_existing_transactions(txn_map, db.get_all_transactions())

    # Any leftover existing transactions have likely changed description. Find
    # the closest match in the new transactions and update the description
    for txn in existing_transactions:
        match = find_matching_transaction(txn, txn_map)
        if match is None:
            raise ValueError(f'Unable to find matching transactions for {txn}')
        db.update_transaction(match.id, match)

    # Any remaining new transactions are indeed new and need to be inserted
    for source in txn_map:
        for date in txn_map[source]:
            for amount in txn_map[source][date]:
                for description in txn_map[source][date][amount]:
                    for _ in range(txn_map[source][date][amount][description]):
                        db.add_transaction(Transaction(source=source, date=date, amount=amount, description=description))


def parse_args() -> List[Dict]:  # pragma: no cover
    '''
    Defines arguments to be parsed from the command line.
    '''
    parser = argparse.ArgumentParser(description='Process a list of transactions and insert into the database')
    parser.add_argument('--transactions', required=True, help='Path to the JSON transaction list')

    args = parser.parse_args()

    if not os.path.isfile(args.transactions):
        parser.error('--transactions JSON file must exist')

    try:
        with open(args.transactions) as fp:
            return json.load(fp)
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
        insert_transactions([Transaction(**txn) for txn in transactions], db)

    return 0


if __name__ == '__main__':  # pragma: no cover
    sys.exit(main())
