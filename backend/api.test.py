#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# api.test.py: This file contains the unit tests for the backend of the budget App
#

# System imports
from fastapi.testclient import TestClient
import unittest

# Local imports
from api import app
from database import Database
from model import Transaction, Allocation


client = TestClient(app)
db = Database()


class TestDatabase(unittest.TestCase):
    def test_tables(self) -> None:
        with db:
            self.assertEqual(set(db.get_tables()), {'setting', 'txn', 'category', 'location', 'allocation'})

    def test_setting_fields(self) -> None:
        with db:
            self.assertEqual(set(db.get_fields('setting')), {'key', 'value'})

    def test_txn_fields(self) -> None:
        with db:
            self.assertEqual(set(db.get_fields('txn')), {'id', 'time', 'amount', 'description', 'source'})

    def test_category_fields(self) -> None:
        with db:
            self.assertEqual(set(db.get_fields('category')), {'id', 'name'})

    def test_location_fields(self) -> None:
        with db:
            self.assertEqual(set(db.get_fields('location')), {'id', 'name'})

    def test_allocation_fields(self) -> None:
        with db:
            self.assertEqual(set(db.get_fields('allocation')), {'id', 'txn_id', 'location_id', 'category_id', 'amount', 'note'})

    def test_create_setting(self) -> None:
        with db:
            db.set_setting('interval', 'monthly')
            self.assertEqual(db.get_setting('interval'), 'monthly')

    def test_clear_setting(self) -> None:
        with db:
            db.set_setting('interval', 'monthly')
            db.set_setting('foo', 'bar')
            self.assertEqual(db.get_setting('interval'), 'monthly')
            db.clear_setting('interval')
            self.assertEqual(db.get_setting('interval'), None)
            self.assertEqual(db.get_setting('foo'), 'bar')

    def test_update_setting(self) -> None:
        with db:
            db.set_setting('interval', 'monthly')
            db.set_setting('foo', 'bar')
            self.assertEqual(db.get_setting('interval'), 'monthly')
            db.set_setting('interval', 'weekly')
            self.assertEqual(db.get_setting('interval'), 'weekly')
            self.assertEqual(db.get_setting('foo'), 'bar')

    def test_add_transaction(self) -> None:
        with db:
            added_txn = db.add_transaction(Transaction(time=1684670193, amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            assert added_txn.id is not None
            txn = db.get_transaction(added_txn.id)
            self.assertIsNotNone(txn)
            assert txn is not None
            self.assertEqual(txn.id, added_txn.id)
            self.assertEqual(txn.time, 1684670193)
            self.assertEqual(txn.amount, 3456)
            self.assertEqual(txn.description, 'FooBar Enterprises')
            self.assertEqual(txn.source, 'Bank of Foo')

    def test_get_invalid_transaction(self) -> None:
        with db:
            txn = db.get_transaction(1234)
            self.assertEqual(txn, None)

    def test_get_transaction_list(self) -> None:
        with db:
            db.add_transaction(Transaction(time=1684670193, amount=3456, description='Joe Pty Ltd', source='Bank of Foo'))
            db.add_transaction(Transaction(time=1684680193, amount=12334, description='Qwerty Inc', source='Bank of Foo'))
            db.add_transaction(Transaction(time=1684690193, amount=938230, description='Joe Pty Ltd', source='Bank of Foo'))
            db.add_transaction(Transaction(time=1684700193, amount=29120, description='Joe Pty Ltd', source='Bank of Foo'))
            txn_list = db.get_transaction_list('description = \'Joe Pty Ltd\'')
            self.assertEqual(len(txn_list), 3)

    def test_default_allocation_added_when_transaction_added(self) -> None:
        with db:
            txn = db.add_transaction(Transaction(time=1684670193, amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = db.get_allocation_list(f'txn_id = {txn.id}')
            self.assertEqual(len(alloc_list), 1)
            self.assertEqual(alloc_list[0].amount, 3456)
            self.assertEqual(alloc_list[0].txn_id, txn.id)
            self.assertEqual(alloc_list[0].category, 'Unknown')
            self.assertEqual(alloc_list[0].location, 'Unknown')

    def test_update_allocation(self) -> None:
        with db:
            txn = db.add_transaction(Transaction(time=1684670193, amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = db.get_allocation_list(f'txn_id = {txn.id}')
            self.assertEqual(len(alloc_list), 1)
            assert alloc_list[0].id is not None
            db.update_allocation(alloc_list[0].id, 'Foo', 'Foo Inc')
            alloc = db.get_allocation(alloc_list[0].id)
            self.assertIsNotNone(alloc)
            assert alloc is not None
            self.assertEqual(alloc.amount, 3456)
            self.assertEqual(alloc.txn_id, txn.id)
            self.assertEqual(alloc.category, 'Foo')
            self.assertEqual(alloc.location, 'Foo Inc')
            assert alloc_list[0].id is not None
            db.update_allocation(alloc_list[0].id, 'Bar', 'Bar Inc')
            alloc = db.get_allocation(alloc_list[0].id)
            assert alloc is not None
            self.assertEqual(alloc.category, 'Bar')
            self.assertEqual(alloc.location, 'Bar Inc')
            assert alloc_list[0].id is not None
            db.update_allocation(alloc_list[0].id, location='Foo Inc')
            alloc = db.get_allocation(alloc_list[0].id)
            assert alloc is not None
            self.assertEqual(alloc.category, 'Bar')
            self.assertEqual(alloc.location, 'Foo Inc')

    def test_update_allocation_note(self) -> None:
        with db:
            txn = db.add_transaction(Transaction(time=1684670193, amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = db.get_allocation_list(f'txn_id = {txn.id}')
            self.assertEqual(len(alloc_list), 1)
            assert alloc_list[0].id is not None
            db.update_allocation(alloc_list[0].id, note='A little note from the heart', category='Shopping')
            alloc = db.get_allocation(alloc_list[0].id)
            assert alloc is not None
            self.assertEqual(alloc.amount, 3456)
            self.assertEqual(alloc.txn_id, txn.id)
            self.assertEqual(alloc.category, 'Shopping')
            self.assertEqual(alloc.location, 'Unknown')
            self.assertEqual(alloc.note, 'A little note from the heart')

    def test_split_allocation(self) -> None:
        with db:
            txn = db.add_transaction(Transaction(time=1684670193, amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = db.get_allocation_list(f'txn_id = {txn.id}')
            self.assertEqual(len(alloc_list), 1)
            assert alloc_list[0].id is not None
            alloc_id = db.split_allocation(alloc_list[0].id, 1234)
            alloc_list = db.get_allocation_list(f'txn_id = {txn.id}')
            self.assertEqual(len(alloc_list), 2)
            assert alloc_list[0].id is not None
            old_idx, new_idx = [1, 0] if alloc_list[0].id == alloc_id else [0, 1]
            assert alloc_list[old_idx].id is not None
            assert alloc_list[new_idx].id is not None
            self.assertEqual(alloc_list[old_idx].amount, 2222)
            self.assertEqual(alloc_list[old_idx].txn_id, txn.id)
            self.assertEqual(alloc_list[old_idx].category, 'Unknown')
            self.assertEqual(alloc_list[old_idx].location, 'Unknown')
            self.assertEqual(alloc_list[new_idx].amount, 1234)
            self.assertEqual(alloc_list[new_idx].txn_id, txn.id)
            self.assertEqual(alloc_list[new_idx].category, 'Unknown')
            self.assertEqual(alloc_list[new_idx].location, 'Unknown')

    def test_throws_if_split_invalid_allocation(self) -> None:
        with db:
            with self.assertRaises(ValueError):
                db.split_allocation(182763, 1234)

    def test_throws_if_split_to_much(self) -> None:
        with db:
            txn = db.add_transaction(Transaction(time=1684670193, amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = db.get_allocation_list(f'txn_id = {txn.id}')
            self.assertEqual(len(alloc_list), 1)
            assert alloc_list[0].id is not None
            with self.assertRaises(ValueError):
                db.split_allocation(alloc_list[0].id, 10000)


class TestAPI(unittest.TestCase):
    def test_add_a_transaction(self) -> None:
        response = client.post("/transaction/", json={
            'time': 1684670193,
            'amount': 3456,
            'description': 'FooBar Enterprises',
            'source': 'Bank of Foo',
        })
        self.assertEqual(response.status_code, 201)
        self.assertGreater(response.json()['id'], 0)

    def test_get_existing_transactions(self) -> None:
        with db:
            txn = db.add_transaction(Transaction(time=1684670193, amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
        response = client.get(f'/transaction/?query=id={txn.id}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]['id'], txn.id)
        self.assertEqual(response.json()[0]['amount'], 3456)
        self.assertEqual(response.json()[0]['description'], 'FooBar Enterprises')
        self.assertEqual(response.json()[0]['source'], 'Bank of Foo')

    def test_get_existing_allocations(self) -> None:
        with db:
            txn = db.add_transaction(Transaction(time=1584670193, amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            db.add_transaction(Transaction(time=1584671193, amount=125, description='123 Inc', source='Bank of Bar'))
            db.add_transaction(Transaction(time=1584672193, amount=13305, description='Qwerty Corp', source='Bank of Foo'))
        response = client.get(f'/allocation/?query=time<1584672000')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)
        for resp in response.json():
            self.assertGreater(resp['id'], 0)
            self.assertGreater(resp['txn_id'], 0)
            self.assertEqual(resp['category'], 'Unknown')
            self.assertEqual(resp['location'], 'Unknown')
            if resp['txn_id'] == txn.id:
                self.assertEqual(resp['time'], 1584670193)
                self.assertEqual(resp['amount'], 3456)
            else:
                self.assertEqual(resp['time'], 1584671193)
                self.assertEqual(resp['amount'], 125)


unittest.main()
