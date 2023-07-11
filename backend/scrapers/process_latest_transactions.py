#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# process_latest_transactions.py: This file processes transactions from coles and
# St George to a format compatible with the budget app
#

# System imports
import sys
import argparse
import os
import json
import datetime
from typing import List, Dict


def parse_coles(raw_trans: Dict):
    '''
    Parse a Coles transaction list

    Args:
        raw_trans: The raw scraped output

    Returns:
        A list of transactions
    '''
    output: List[Dict] = []
    for item in raw_trans.get('transaction', []):
        output.append({
            'date': item['transactionDate'],
            'description': item['transactionDescription'],
            'amount': item['transactionAmount'],
            'source': 'coles',
        })

    return output


def parse_stgeorge(raw_trans: Dict):
    '''
    Parse a St George transaction list

    Args:
        raw_trans: The raw scraped output

    Returns:
        A list of transactions
    '''
    output: List[Dict] = []
    for item in raw_trans.get('transactions', []):
        output.append({
            'date': datetime.datetime.strptime(item['raw']['Date'], '%d/%m/%Y').strftime('%Y-%m-%d'),
            'description': item['description'],
            'amount': item['amount'],
            'source': 'stgeorge',
        })

    return output


def parse_args():
    '''
    Defines arguments to be parsed from the command line.
    '''
    parser = argparse.ArgumentParser(description='Process St George and Coles transactions')
    parser.add_argument('--coles',    required=True, help='Path to a coles JSON file')
    parser.add_argument('--stgeorge', required=True, help='Path to St George JSON file')
    parser.add_argument('--output',   required=True, help='Output JSON file')

    args = parser.parse_args()

    if not os.path.isfile(args.coles):
        parser.error('--coles JSON file must exist')
    if not os.path.isfile(args.stgeorge):
        parser.error('--stgeorge JSON file must exist')

    return args


def main():
    '''
    The main function

    Returns:
        code to use as the exit status
    '''
    args = parse_args()

    transactions = []
    with open(args.coles) as fp:
        transactions.extend(parse_coles(json.load(fp)))
    with open(args.stgeorge) as fp:
        transactions.extend(parse_stgeorge(json.load(fp)))

    with open(args.output, 'w') as fp:
        json.dump(sorted(transactions, key=lambda x: x['date']), fp)

    return 0


if __name__ == '__main__':
    sys.exit(main())
