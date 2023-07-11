#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# process_latest_transactions.test.py: This file contains the unit tests for
# the script that processes the raw transactions scraped from the web
#

# System imports
import unittest
import time

from process_latest_transactions import parse_coles, parse_stgeorge


dummy_coles_data = {
    'transaction': [
        {
            'transactionDate': '2023-06-24',
            'transactionDescription': 'EVERYDAY PET INSURANC  CHATSWOOD     AUS',
            'transactionAmount': -55.47,
            'currencyCode': 'AUD',
            'transactionType': 'EVERYDAY PET INSURANC  CHATSWOOD     AUS',
            'nfcEnrolled': False,
            'principalAmountAfterPost': 0.0,
            'displayLoanDetails': False
        },
        {
            'transactionDate': '2023-06-25',
            'transactionDescription': 'CEDAR CREEK RESTAURANT NORTH TAMBORI AUS',
            'transactionAmount': -38.38,
            'currencyCode': 'AUD',
            'transactionType': 'CEDAR CREEK RESTAURANT NORTH TAMBORI AUS',
            'displayCardNumber': 'xxxxxxxxxxxxxxx9283',
            'nfcEnrolled': False,
            'principalAmountAfterPost': 0.0,
            'displayLoanDetails': False,
            'cardId': '6248535265426293191'
        },
        {
            'transactionDate': '2023-06-25',
            'transactionPostingDate': '2023-06-26',
            'transactionDescription': 'SQ *TAMBORINE MOUNTAIN   Tamborine MouAU',
            'transactionCode': 15,
            'referenceIdNumber': '02711983118292932127390',
            'eligibleForEqualPaymentPlan': 'Y',
            'transactionAmount': -6,
            'currencyCode': 'AUD',
            'transactionType': 'SQ *TAMBORINE MOUNTAIN   Tamborine MouAU',
            'transactionStatus': 'UNBILLED',
            'nfcEnrolled': False,
            'principalAmountAfterPost': 0.0,
            'displayLoanDetails': False
        },
    ]}


dummy_stgeorge_data = {
    'balance': 7651.05,
    'type': 'St George',
    'transactions': [
        {
            'time': 1687485600,
            'description': 'Tfr Wdl BPAY Internet 23Jun16:04: 9827332837454329 Foo Credit Ca',
            'category': 'Bills & Payments',
            'source': 'St George',
            'amount': -428.82,
            'raw': {
                'Date': '23/06/2023',
                'Description': 'Tfr Wdl BPAY Internet 23Jun16:04: 9827332837454329 Foo Credit Ca',
                'Category': 'Bills & Payments',
                'Debit': 428.82,
                'Credit': 0,
                'Balance': 7651.05
            }
        },
        {
            'time': 1687140000,
            'description': 'Bar Inc: Fb1R55452w0239842S',
            'category': 'Income',
            'source': 'St George',
            'amount': 168.28,
            'raw': {
                'Date': '19/06/2023',
                'Description': 'Bar Inc: Fb1R55452w0239842S',
                'Category': 'Income',
                'Debit': 0,
                'Credit': 168.28,
                'Balance': 13733.32
            }
        },
    ]
}


class TestProcessLatestTransactions(unittest.TestCase):
    def test_coles_empty_data(self) -> None:
        self.assertEqual(parse_coles({}), [])

    def test_coles_returns_correct_count(self) -> None:
        self.assertEqual(len(parse_coles(dummy_coles_data)), 3)

    def test_coles_returns_correct_data(self) -> None:
        self.assertEqual(parse_coles(dummy_coles_data), [
            {
                'date': '2023-06-24',
                'description': 'EVERYDAY PET INSURANC  CHATSWOOD     AUS',
                'amount': -55.47,
                'source': 'coles',
            },
            {
                'date': '2023-06-25',
                'description': 'CEDAR CREEK RESTAURANT NORTH TAMBORI AUS',
                'amount': -38.38,
                'source': 'coles',
            },
            {
                'date': '2023-06-25',
                'description': 'SQ *TAMBORINE MOUNTAIN   Tamborine MouAU',
                'amount': -6,
                'source': 'coles',
            },
        ])

    def test_stgeorge_empty_data(self) -> None:
        self.assertEqual(parse_stgeorge({}), [])

    def test_stgeorge_returns_correct_count(self) -> None:
        self.assertEqual(len(parse_stgeorge(dummy_stgeorge_data)), 2)

    def test_stgeorge_returns_correct_data(self) -> None:
        self.assertEqual(parse_stgeorge(dummy_stgeorge_data), [
            {
                'date': '2023-06-23',
                'description': 'Tfr Wdl BPAY Internet 23Jun16:04: 9827332837454329 Foo Credit Ca',
                'amount': -428.82,
                'source': 'stgeorge',
            },
            {
                'date': '2023-06-19',
                'description': 'Bar Inc: Fb1R55452w0239842S',
                'amount': 168.28,
                'source': 'stgeorge',
            },
        ])


unittest.main()
