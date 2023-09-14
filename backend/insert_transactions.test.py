#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# insert_transactions.test.py: This file contains the unit tests for the script
# that inserts the processed transactions into the database
#

# System imports
import unittest
from typing import List

# Local imports
from insert_transactions import insert_transactions
from database import Database
from model import Transaction


class TestInsertTransactions(unittest.TestCase):
    def setUp(self) -> None:
        self.dummy_data = [
            Transaction(
                date='2023-08-03',
                description='FOO BAR PTY LTD        SOMETOWN    AU',
                amount=-3140,
                source='bank of foo'
            ),
            Transaction(
                date='2023-08-03',
                description='PAYPAL *MENULOGPTYL      2938473727   AU',
                amount=-3423,
                source='bank of foo'
            ),
            Transaction(
                date='2023-08-03',
                description='PETROL EXPRESS 1830       SOMETOWN    AU',
                amount=-28732,
                source='bank of foo'
            ),
            Transaction(
                date='2023-08-03',
                description='QWERTY FACES PTY LT   FOOVILLE     AU',
                amount=-97420,
                source='bank of foo'
            ),
            Transaction(
                date='2023-08-03',
                description='QWERTY FACES PTY LT   FOOVILLE     AU',
                amount=-97420,
                source='bank of foo'
            ),
            Transaction(
                date='2023-08-05',
                description='FASTFOOD DT 0398        QWERTY FOOAU XXXX-XXXX-XXXX-2837',
                amount=-7745,
                source='bank of foo'
            ),
            Transaction(
                date='2023-08-05',
                description='ALLDAY PET INSURANC    FOOVILLE    AU',
                amount=-7745,
                source='bank of foo'
            ),
            Transaction(
                date='2023-08-07',
                description='Osko Withdrawal 04Aug09:05: Inv 1234 Fooville Community Collage',
                amount=-15400,
                source='Bar Inc'
            ),
            Transaction(
                date='2023-08-03',
                description='Osko Withdrawal 02Aug08:51: Jim Bday Money',
                amount=-6000,
                source='Bar Inc'
            ),
        ]
        self.db = Database()
        self.db.open()
        self.db.db.execute('DELETE FROM txn')
        self.db.db.execute('DELETE FROM category WHERE id > 1')
        self.db.db.execute('DELETE FROM location WHERE id > 1')
        self.db.db.execute('DELETE FROM allocation')
        return super().setUp()

    def tearDown(self) -> None:
        self.db.close()
        return super().tearDown()

    def test_empty_list(self) -> None:
        transactions: List[Transaction] = []
        insert_transactions(transactions, self.db)
        txn_list = self.db.get_all_transactions()
        self.assertEqual(len(txn_list), 0)

    def test_full_list(self) -> None:
        insert_transactions(self.dummy_data, self.db)
        txn_list = self.db.get_all_transactions()
        self.assertEqual(len(txn_list), len(self.dummy_data))

    def test_already_existing(self) -> None:
        self.db.add_transaction(self.dummy_data[0])
        self.db.add_transaction(self.dummy_data[2])
        self.db.add_transaction(self.dummy_data[5])

        insert_transactions(self.dummy_data, self.db)
        txn_list = self.db.get_all_transactions()
        self.assertEqual(len(txn_list), len(self.dummy_data))

    def test_already_existing_update_description(self) -> None:
        txn = self.db.add_transaction(Transaction(
            date='2023-08-03',
            description='FOO BAR PTY LTD SOME TOWN',
            amount=-3140,
            source='bank of foo'
        ))
        assert txn.id is not None

        insert_transactions(self.dummy_data, self.db)
        updated_txn = self.db.get_transaction(txn.id)
        assert updated_txn is not None
        all_txn = self.db.get_all_transactions()
        self.assertEqual(len(all_txn), len(self.dummy_data))
        self.assertEqual(updated_txn.description, 'FOO BAR PTY LTD        SOMETOWN    AU')

    def test_already_existing_multiple_same_amount_same_day_same_descriptions(self) -> None:
        txn = self.dummy_data[2]
        self.db.add_transaction(txn)
        txn = self.dummy_data[4]
        self.db.add_transaction(txn)

        insert_transactions(self.dummy_data, self.db)
        txn_list = self.db.get_all_transactions()
        self.assertEqual(len(txn_list), len(self.dummy_data))

    def test_new_entry_same_day_same_amount(self) -> None:
        txn = Transaction(
            date='2023-08-03',
            description='Some Other Transaction',
            amount=-97420,
            source='bank of foo'
        )
        self.db.add_transaction(txn)
        self.dummy_data.append(txn)

        insert_transactions(self.dummy_data, self.db)
        txn_list = self.db.get_all_transactions()
        same_amount_txn_list = self.db.get_transaction_list(f'amount = -7745')
        self.assertEqual(len(same_amount_txn_list), 2)
        self.assertEqual(len(txn_list), len(self.dummy_data))

    def test_multiple_same_amount_same_day_change_descriptions(self) -> None:
        txn1 = Transaction(
            date='2023-08-05',
            description='ALLDAY PET INSURANCE FOOVILLE',
            amount=-7745,
            source='bank of foo'
        )
        txn2 = Transaction(
            date='2023-08-05',
            description='FASTFOOD DT 0398        QWERTY FOO AUS',
            amount=-7745,
            source='bank of foo'
        )
        self.db.add_transaction(txn1)
        self.db.add_transaction(txn2)
        assert txn1.id is not None
        assert txn2.id is not None

        insert_transactions(self.dummy_data, self.db)

        txn_list = self.db.get_all_transactions()
        updated_txn1 = self.db.get_transaction(txn1.id)
        updated_txn2 = self.db.get_transaction(txn2.id)
        assert updated_txn1 is not None
        assert updated_txn2 is not None
        self.assertEqual(len(txn_list), len(self.dummy_data))
        self.assertEqual(updated_txn1.description, 'ALLDAY PET INSURANC    FOOVILLE    AU')
        self.assertEqual(updated_txn2.description, 'FASTFOOD DT 0398        QWERTY FOOAU XXXX-XXXX-XXXX-2837')

    def test_changed_description_too_much(self) -> None:
        txn = Transaction(
            date='2023-08-05',
            description='Completely different',
            amount=-7745,
            source='bank of foo'
        )
        self.db.add_transaction(txn)
        assert txn.id is not None

        insert_transactions(self.dummy_data, self.db)
        txn_list = self.db.get_all_transactions()
        self.assertEqual(len(txn_list), len(self.dummy_data) + 1)

    def test_already_existing_multiple_identcal(self) -> None:
        insert_transactions(self.dummy_data, self.db)
        txn_list = self.db.get_all_transactions()
        self.assertEqual(len(txn_list), len(self.dummy_data))

        txn = Transaction(
            date='2023-08-03',
            description='QWERTY FACES PTY LT   FOOVILLE     AU',
            amount=-97420,
            source='bank of foo'
        )
        insert_transactions([txn.copy()], self.db)
        txn_list = self.db.get_all_transactions()
        self.assertEqual(len(txn_list), len(self.dummy_data))

        insert_transactions([txn.copy(), txn.copy()], self.db)
        txn_list = self.db.get_all_transactions()
        self.assertEqual(len(txn_list), len(self.dummy_data))

        insert_transactions([txn.copy(), txn.copy(), txn.copy()], self.db)
        txn_list = self.db.get_all_transactions()
        self.assertEqual(len(txn_list), len(self.dummy_data) + 1)


unittest.main()
