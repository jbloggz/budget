#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# api.test.py: This file contains the unit tests for the backend of the budget App
#

from fastapi.testclient import TestClient
import unittest
from api import app
from database import Database

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
            self.assertEqual(set(db.get_fields('allocation')), {'id', 'txn_id', 'location_id', 'category_id', 'amount'})

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
            txn_id = db.add_transaction(1684670193, 3456, 'FooBar Enterprises', 'Bank of Foo')
            txn = db.get_transaction(txn_id)
            self.assertIsNotNone(txn)
            assert txn is not None
            self.assertEqual(txn['id'], txn_id)
            self.assertEqual(txn['time'], 1684670193)
            self.assertEqual(txn['amount'], 3456)
            self.assertEqual(txn['description'], 'FooBar Enterprises')
            self.assertEqual(txn['source'], 'Bank of Foo')

    def test_get_invalid_transaction(self) -> None:
        with db:
            txn = db.get_transaction(1234)
            self.assertEqual(txn, None)

    def test_get_transaction_list(self) -> None:
        with db:
            db.add_transaction(1684670193, 3456, 'Joe Pty Ltd', 'Bank of Foo')
            db.add_transaction(1684680193, 12334, 'Qwerty Inc', 'Bank of Foo')
            db.add_transaction(1684690193, 938230, 'Joe Pty Ltd', 'Bank of Foo')
            db.add_transaction(1684700193, 29120, 'Joe Pty Ltd', 'Bank of Foo')
            txn_list = db.get_transaction_list('description = \'Joe Pty Ltd\'')
            self.assertEqual(len(txn_list), 3)

    def test_default_allocation_added_when_transaction_added(self) -> None:
        with db:
            txn_id = db.add_transaction(1684670193, 3456, 'FooBar Enterprises', 'Bank of Foo')
            alloc_list = db.get_allocation_list(f'txn_id = {txn_id}')
            self.assertEqual(len(alloc_list), 1)
            self.assertEqual(alloc_list[0]['amount'], 3456)
            self.assertEqual(alloc_list[0]['txn_id'], txn_id)
            self.assertEqual(alloc_list[0]['category'], 'Unknown')
            self.assertEqual(alloc_list[0]['location'], 'Unknown')

    def test_update_allocation(self) -> None:
        with db:
            txn_id = db.add_transaction(1684670193, 3456, 'FooBar Enterprises', 'Bank of Foo')
            alloc_list = db.get_allocation_list(f'txn_id = {txn_id}')
            self.assertEqual(len(alloc_list), 1)
            db.update_allocation(alloc_list[0]['id'], 'Foo', 'Foo Inc')
            alloc = db.get_allocation(alloc_list[0]['id'])
            self.assertIsNotNone(alloc)
            assert alloc is not None
            self.assertEqual(alloc['amount'], 3456)
            self.assertEqual(alloc['txn_id'], txn_id)
            self.assertEqual(alloc['category'], 'Foo')
            self.assertEqual(alloc['location'], 'Foo Inc')
            db.update_allocation(alloc_list[0]['id'], 'Bar', 'Bar Inc')
            alloc = db.get_allocation(alloc_list[0]['id'])
            assert alloc is not None
            self.assertEqual(alloc['category'], 'Bar')
            self.assertEqual(alloc['location'], 'Bar Inc')
            db.update_allocation(alloc_list[0]['id'], 'Foo', 'Foo Inc')
            alloc = db.get_allocation(alloc_list[0]['id'])
            assert alloc is not None
            self.assertEqual(alloc['category'], 'Foo')
            self.assertEqual(alloc['location'], 'Foo Inc')

    def test_split_allocation(self) -> None:
        with db:
            txn_id = db.add_transaction(1684670193, 3456, 'FooBar Enterprises', 'Bank of Foo')
            alloc_list = db.get_allocation_list(f'txn_id = {txn_id}')
            self.assertEqual(len(alloc_list), 1)
            alloc_id = db.split_allocation(alloc_list[0]['id'], 1234)
            alloc_list = db.get_allocation_list(f'txn_id = {txn_id}')
            self.assertEqual(len(alloc_list), 2)
            old_idx, new_idx = [1, 0] if alloc_list[0]['id'] == alloc_id else [0, 1]
            self.assertEqual(alloc_list[old_idx]['amount'], 2222)
            self.assertEqual(alloc_list[old_idx]['txn_id'], txn_id)
            self.assertEqual(alloc_list[old_idx]['category'], 'Unknown')
            self.assertEqual(alloc_list[old_idx]['location'], 'Unknown')
            self.assertEqual(alloc_list[new_idx]['amount'], 1234)
            self.assertEqual(alloc_list[new_idx]['txn_id'], txn_id)
            self.assertEqual(alloc_list[new_idx]['category'], 'Unknown')
            self.assertEqual(alloc_list[new_idx]['location'], 'Unknown')

    def test_throws_if_split_invalid_allocation(self) -> None:
        with db:
            with self.assertRaises(ValueError):
                db.split_allocation(182763, 1234)

    def test_throws_if_split_to_much(self) -> None:
        with db:
            txn_id = db.add_transaction(1684670193, 3456, 'FooBar Enterprises', 'Bank of Foo')
            alloc_list = db.get_allocation_list(f'txn_id = {txn_id}')
            self.assertEqual(len(alloc_list), 1)
            with self.assertRaises(ValueError):
                db.split_allocation(alloc_list[0]['id'], 10000)


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
            txn_id = db.add_transaction(1684670193, 3456, 'FooBar Enterprises', 'Bank of Foo')
        response = client.get(f'/transaction/?query=id={txn_id}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]['id'], txn_id)
        self.assertEqual(response.json()[0]['amount'], 3456)
        self.assertEqual(response.json()[0]['description'], 'FooBar Enterprises')
        self.assertEqual(response.json()[0]['source'], 'Bank of Foo')

    def test_get_existing_allocations(self) -> None:
        with db:
            txn_id = db.add_transaction(1584670193, 3456, 'FooBar Enterprises', 'Bank of Foo')
            db.add_transaction(1584671193, 125, '123 Inc', 'Bank of Bar')
            db.add_transaction(1584672193, 13305, 'Qwerty Corp', 'Bank of Foo')
        response = client.get(f'/allocation/?query=time<1584672000')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)
        for resp in response.json():
            self.assertGreater(resp['id'], 0)
            self.assertGreater(resp['txn_id'], 0)
            self.assertEqual(resp['category'], 'Unknown')
            self.assertEqual(resp['location'], 'Unknown')
            if resp['txn_id'] == txn_id:
                self.assertEqual(resp['time'], 1584670193)
                self.assertEqual(resp['amount'], 3456)
            else:
                self.assertEqual(resp['time'], 1584671193)
                self.assertEqual(resp['amount'], 125)


unittest.main()
