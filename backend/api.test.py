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
import time

# Local imports
from api import app
from database import Database
from model import Transaction, CachedToken
from auth import secrets, hash_password, create_token


class TestDatabase(unittest.TestCase):
    def setUp(self) -> None:
        self.db = Database()
        with self.db:
            self.db.db.execute('DELETE FROM txn')
            self.db.db.execute('DELETE FROM category WHERE id > 1')
            self.db.db.execute('DELETE FROM location WHERE id > 1')
            self.db.db.execute('DELETE FROM allocation')
        return super().setUp()

    def test_tables(self) -> None:
        with self.db:
            self.assertEqual(set(self.db.get_tables()), {'setting', 'txn', 'category', 'location', 'allocation', 'token'})

    def test_setting_fields(self) -> None:
        with self.db:
            self.assertEqual(set(self.db.get_fields('setting')), {'key', 'value'})

    def test_token_fields(self) -> None:
        with self.db:
            self.assertEqual(set(self.db.get_fields('token')), {'value', 'expire'})

    def test_txn_fields(self) -> None:
        with self.db:
            self.assertEqual(set(self.db.get_fields('txn')), {'id', 'date', 'amount', 'description', 'source', 'balance'})

    def test_category_fields(self) -> None:
        with self.db:
            self.assertEqual(set(self.db.get_fields('category')), {'id', 'name'})

    def test_location_fields(self) -> None:
        with self.db:
            self.assertEqual(set(self.db.get_fields('location')), {'id', 'name'})

    def test_allocation_fields(self) -> None:
        with self.db:
            self.assertEqual(set(self.db.get_fields('allocation')), {'id', 'txn_id', 'location_id', 'category_id', 'amount', 'note'})

    def test_create_setting(self) -> None:
        with self.db:
            self.db.set_setting('interval', 'monthly')
            self.assertEqual(self.db.get_setting('interval'), 'monthly')

    def test_clear_setting(self) -> None:
        with self.db:
            self.db.set_setting('interval', 'monthly')
            self.db.set_setting('foo', 'bar')
            self.assertEqual(self.db.get_setting('interval'), 'monthly')
            self.db.clear_setting('interval')
            self.assertEqual(self.db.get_setting('interval'), None)
            self.assertEqual(self.db.get_setting('foo'), 'bar')

    def test_update_setting(self) -> None:
        with self.db:
            self.db.set_setting('interval', 'monthly')
            self.db.set_setting('foo', 'bar')
            self.assertEqual(self.db.get_setting('interval'), 'monthly')
            self.db.set_setting('interval', 'weekly')
            self.assertEqual(self.db.get_setting('interval'), 'weekly')
            self.assertEqual(self.db.get_setting('foo'), 'bar')

    def test_add_token(self) -> None:
        with self.db:
            self.assertIsNone(self.db.get_cached_token('test_add_token'))
            self.db.add_cached_token(CachedToken(value='test_add_token', expire=int(time.time()) + 60))
            self.assertIsNotNone(self.db.get_cached_token('test_add_token'))

    def test_clear_token(self) -> None:
        with self.db:
            self.db.add_cached_token(CachedToken(value='298h2938f', expire=int(time.time()) + 60))
            self.assertIsNotNone(self.db.get_cached_token('298h2938f'))
            self.db.clear_cached_token('298h2938f')
            self.assertIsNone(self.db.get_cached_token('298h2938f'))

    def test_expire_token(self) -> None:
        with self.db:
            self.db.add_cached_token(CachedToken(value='test_expire_token', expire=int(time.time()) + 1))
            self.assertIsNotNone(self.db.get_cached_token('test_expire_token'))
            time.sleep(1)
            self.assertIsNone(self.db.get_cached_token('test_expire_token'))

    def test_add_transaction(self) -> None:
        with self.db:
            added_txn = self.db.add_transaction(Transaction(date='2023-07-03', amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            assert added_txn.id is not None
            txn = self.db.get_transaction(added_txn.id)
            self.assertIsNotNone(txn)
            assert txn is not None
            self.assertEqual(txn.id, added_txn.id)
            self.assertEqual(txn.date, '2023-07-03')
            self.assertEqual(txn.amount, 3456)
            self.assertEqual(txn.description, 'FooBar Enterprises')
            self.assertEqual(txn.source, 'Bank of Foo')

    def test_get_invalid_transaction(self) -> None:
        with self.db:
            txn = self.db.get_transaction(1234)
            self.assertEqual(txn, None)

    def test_get_transaction_list(self) -> None:
        with self.db:
            self.db.add_transaction(Transaction(date='2023-07-04', amount=3456, description='Joe Pty Ltd', source='Bank of Foo'))
            self.db.add_transaction(Transaction(date='2023-07-04', amount=12334, description='Qwerty Inc', source='Bank of Foo'))
            self.db.add_transaction(Transaction(date='2023-07-04', amount=938230, description='Joe Pty Ltd', source='Bank of Foo'))
            self.db.add_transaction(Transaction(date='2023-07-04', amount=29120, description='Joe Pty Ltd', source='Bank of Foo'))
            txn_list = self.db.get_transaction_list('description = \'Joe Pty Ltd\'')
            self.assertEqual(txn_list.total, 3)
            self.assertEqual(len(txn_list.transactions), 3)
            txn_list = self.db.get_transaction_list('description = ?', ('Joe Pty Ltd',))
            self.assertEqual(txn_list.total, 3)
            self.assertEqual(len(txn_list.transactions), 3)

    def test_delete_transactions(self) -> None:
        with self.db:
            initial_count = len(self.db.get_transaction_list().transactions)
            txn1 = self.db.add_transaction(Transaction(date='2023-07-10', amount=23511, description='FooBar Enterprises', source='Bank of Foo'))
            assert txn1.id is not None
            txn2 = self.db.add_transaction(Transaction(date='2023-07-11', amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            assert txn2.id is not None
            added_count = len(self.db.get_transaction_list().transactions)
            self.assertEqual(added_count, initial_count + 2)
            self.db.delete_transactions([txn1.id, txn2.id])
            final_count = len(self.db.get_transaction_list().transactions)
            self.assertEqual(final_count, initial_count)

    def test_default_allocation_added_when_transaction_added(self) -> None:
        with self.db:
            txn = self.db.add_transaction(Transaction(date='2023-07-09', amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = self.db.get_allocation_list(f'txn_id = {txn.id}').allocations
            self.assertEqual(len(alloc_list), 1)
            self.assertEqual(alloc_list[0].amount, 3456)
            self.assertEqual(alloc_list[0].txn_id, txn.id)
            self.assertEqual(alloc_list[0].category, 'Unknown')
            self.assertEqual(alloc_list[0].location, 'Unknown')

    def test_get_category_id(self):
        with self.db:
            self.assertEqual(self.db.get_category_id('Unknown'), 1)
            self.assertGreater(self.db.get_category_id('test_get_category_id'), 1)

    def test_get_location_id(self):
        with self.db:
            self.assertEqual(self.db.get_location_id('Unknown'), 1)
            self.assertGreater(self.db.get_location_id('test_get_location_id'), 1)

    def test_update_allocation(self) -> None:
        with self.db:
            txn = self.db.add_transaction(Transaction(date='2023-07-10', amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = self.db.get_allocation_list(f'txn_id = {txn.id}').allocations
            self.assertEqual(len(alloc_list), 1)
            assert alloc_list[0].id is not None

            alloc_list[0].category = 'Foo'
            alloc_list[0].location = 'Foo Inc'
            self.db.update_allocation(alloc_list[0])
            alloc = self.db.get_allocation(alloc_list[0].id)
            self.assertIsNotNone(alloc)
            assert alloc is not None
            self.assertEqual(alloc.amount, 3456)
            self.assertEqual(alloc.txn_id, txn.id)
            self.assertEqual(alloc.category, 'Foo')
            self.assertEqual(alloc.location, 'Foo Inc')
            assert alloc_list[0].id is not None

            alloc_list[0].category = 'Bar'
            alloc_list[0].location = 'Bar Inc'
            self.db.update_allocation(alloc_list[0])
            alloc = self.db.get_allocation(alloc_list[0].id)
            assert alloc is not None
            self.assertEqual(alloc.category, 'Bar')
            self.assertEqual(alloc.location, 'Bar Inc')
            assert alloc_list[0].id is not None

            alloc_list[0].location = 'Foo Inc'
            self.db.update_allocation(alloc_list[0])
            alloc = self.db.get_allocation(alloc_list[0].id)
            assert alloc is not None
            self.assertEqual(alloc.category, 'Bar')
            self.assertEqual(alloc.location, 'Foo Inc')

            alloc_list[0].category = 'Foo'
            self.db.update_allocation(alloc_list[0])
            alloc = self.db.get_allocation(alloc_list[0].id)
            assert alloc is not None
            self.assertEqual(alloc.category, 'Foo')
            self.assertEqual(alloc.location, 'Foo Inc')

    def test_update_allocation_note(self) -> None:
        with self.db:
            txn = self.db.add_transaction(Transaction(date='2023-07-11', amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = self.db.get_allocation_list(f'txn_id = {txn.id}').allocations
            self.assertEqual(len(alloc_list), 1)
            assert alloc_list[0].id is not None
            alloc_list[0].note = 'A little note from the heart'
            alloc_list[0].category = 'Shopping'
            self.db.update_allocation(alloc_list[0])
            alloc = self.db.get_allocation(alloc_list[0].id)
            assert alloc is not None
            self.assertEqual(alloc.amount, 3456)
            self.assertEqual(alloc.txn_id, txn.id)
            self.assertEqual(alloc.description, 'FooBar Enterprises')
            self.assertEqual(alloc.category, 'Shopping')
            self.assertEqual(alloc.location, 'Unknown')
            self.assertEqual(alloc.note, 'A little note from the heart')

    def test_refuses_to_update_allocation_txn_id_and_amount(self) -> None:
        with self.db:
            txn = self.db.add_transaction(Transaction(date='2023-07-15', amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = self.db.get_allocation_list(f'txn_id = {txn.id}').allocations
            self.assertEqual(len(alloc_list), 1)
            assert alloc_list[0].id is not None
            alloc_list[0].txn_id = 1234
            alloc_list[0].amount = 999999
            self.db.update_allocation(alloc_list[0])
            alloc = self.db.get_allocation(alloc_list[0].id)
            assert alloc is not None
            self.assertEqual(alloc.amount, 3456)
            self.assertEqual(alloc.txn_id, txn.id)
            self.assertEqual(alloc.category, 'Unknown')
            self.assertEqual(alloc.location, 'Unknown')
            self.assertIsNone(alloc.note)

    def test_split_allocation(self) -> None:
        with self.db:
            txn = self.db.add_transaction(Transaction(date='2023-07-15', amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = self.db.get_allocation_list(f'txn_id = {txn.id}').allocations
            self.assertEqual(len(alloc_list), 1)
            assert alloc_list[0].id is not None
            alloc_id = self.db.split_allocation(alloc_list[0].id, 1234)
            alloc_list = self.db.get_allocation_list(f'txn_id = {txn.id}').allocations
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

    def test_get_transaction_allocations(self) -> None:
        with self.db:
            txn = self.db.add_transaction(Transaction(date='2023-07-16', amount=18743, description='FooBar Enterprises', source='Bank of Foo'))
            assert txn.id is not None
            alloc_list = self.db.get_txn_allocations(txn.id).allocations
            self.assertEqual(len(alloc_list), 1)
            assert alloc_list[0].id is not None
            self.db.split_allocation(alloc_list[0].id, 8272)
            alloc_list = self.db.get_txn_allocations(txn.id).allocations
            self.assertEqual(len(alloc_list), 2)

    def test_throws_if_split_invalid_allocation(self) -> None:
        with self.db:
            with self.assertRaises(ValueError):
                self.db.split_allocation(182763, 1234)

    def test_throws_if_split_to_much(self) -> None:
        with self.db:
            txn = self.db.add_transaction(Transaction(date='2023-07-15', amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = self.db.get_allocation_list(f'txn_id = {txn.id}').allocations
            self.assertEqual(len(alloc_list), 1)
            assert alloc_list[0].id is not None
            with self.assertRaises(ValueError):
                self.db.split_allocation(alloc_list[0].id, 10000)

    def test_merge_allocations(self) -> None:
        with self.db:
            txn = self.db.add_transaction(Transaction(date='2023-07-15', amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = self.db.get_allocation_list(f'txn_id = {txn.id}').allocations
            self.assertEqual(len(alloc_list), 1)
            assert alloc_list[0].id is not None
            self.db.split_allocation(alloc_list[0].id, 1234)
            alloc_list = self.db.get_allocation_list(f'txn_id = {txn.id}').allocations
            self.assertEqual(len(alloc_list), 2)
            assert alloc_list[0].id is not None
            self.assertEqual(alloc_list[0].amount, 2222)
            self.assertEqual(alloc_list[1].amount, 1234)
            assert alloc_list[0].id is not None
            assert alloc_list[1].id is not None
            self.db.merge_allocations([alloc_list[0].id, alloc_list[1].id])
            alloc_list = self.db.get_allocation_list(f'txn_id = {txn.id}').allocations
            self.assertEqual(len(alloc_list), 1)
            self.assertEqual(alloc_list[0].amount, 3456)

    def test_throws_if_merge_no_allocations(self) -> None:
        with self.db:
            with self.assertRaises(ValueError):
                self.db.merge_allocations([12938, 92387423])

    def test_no_op_if_merge_single_allocation(self) -> None:
        with self.db:
            txn = self.db.add_transaction(Transaction(date='2023-07-15', amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = self.db.get_allocation_list(f'txn_id = {txn.id}').allocations
            self.assertEqual(len(alloc_list), 1)
            self.assertEqual(alloc_list[0].amount, 3456)
            assert alloc_list[0].id is not None
            self.db.merge_allocations([alloc_list[0].id])
            alloc_list = self.db.get_allocation_list(f'txn_id = {txn.id}').allocations
            self.assertEqual(alloc_list[0].amount, 3456)
            self.assertEqual(len(alloc_list), 1)

    def test_throws_if_merge_invalid_allocations(self) -> None:
        with self.db:
            txn1 = self.db.add_transaction(Transaction(date='2023-07-15', amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            txn2 = self.db.add_transaction(Transaction(date='2023-07-16', amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            assert txn1.id is not None
            assert txn2.id is not None
            alloc_list = self.db.get_allocation_list(f'txn_id IN ({txn1.id},{txn2.id})').allocations
            assert len(alloc_list) == 2
            assert alloc_list[0].id is not None
            assert alloc_list[1].id is not None
            with self.assertRaises(ValueError):
                self.db.merge_allocations([alloc_list[0].id, alloc_list[1].id])


class TestAPI(unittest.TestCase):
    def setUp(self) -> None:
        self.db = Database()
        with self.db:
            self.db.db.execute('DELETE FROM txn')
            self.db.db.execute('DELETE FROM category WHERE id > 1')
            self.db.db.execute('DELETE FROM location WHERE id > 1')
            self.db.db.execute('DELETE FROM allocation')

        self.client = TestClient(app)
        secrets['users']['foo'] = {
            "api": "rw",
            "hash": hash_password('bar')
        }
        form_data = {'username': 'foo', 'password': 'bar', 'grant_type': 'password'}
        response = self.client.post('/api/oauth2/token/', data=form_data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
        self.assertEqual(response.status_code, 200)
        self.token = response.json()['access_token']
        self.client.headers.update({'Authorization': f'Bearer {self.token}'})
        return super().setUp()

    def test_add_a_transaction(self) -> None:
        response = self.client.post('/api/transaction/', json={
            'date': '2023-05-02',
            'amount': 3456,
            'description': 'FooBar Enterprises',
            'source': 'Bank of Foo',
        })
        self.assertEqual(response.status_code, 201)
        self.assertGreater(response.json()['id'], 0)

    def test_get_existing_transaction(self) -> None:
        with self.db:
            txn = self.db.add_transaction(Transaction(date='2023-07-15', amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
        response = self.client.get(f'/api/transaction/{txn.id}')
        self.assertEqual(response.status_code, 200)
        transaction = response.json()
        self.assertEqual(transaction['id'], txn.id)
        self.assertEqual(transaction['amount'], 3456)
        self.assertEqual(transaction['description'], 'FooBar Enterprises')
        self.assertEqual(transaction['source'], 'Bank of Foo')

    def test_get_existing_missing_transaction(self) -> None:
        with self.db:
            txn = self.db.add_transaction(Transaction(date='2023-07-15', amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
        response = self.client.get(f'/api/transaction/999999')
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json())

    def test_get_all_transactions(self) -> None:
        with self.db:
            self.db.add_transaction(Transaction(date='2023-07-15', amount=3556, description='FooBar Enterprises1', source='Bank of Foo'))
            self.db.add_transaction(Transaction(date='2023-07-16', amount=3656, description='FooBar Enterprises2', source='Bank of Foo'))
            self.db.add_transaction(Transaction(date='2023-07-17', amount=3756, description='FooBar Enterprises3', source='Bank of Foo'))
            self.db.add_transaction(Transaction(date='2023-07-18', amount=3856, description='FooBar Enterprises4', source='Bank of Foo'))
        response = self.client.get(f'/api/transaction/?start=2023-07-15&end=2023-07-18')
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json()['total'], 4)
        self.assertGreaterEqual(len(response.json()['transactions']), 4)

    def test_get_limit_transactions(self) -> None:
        with self.db:
            self.db.add_transaction(Transaction(date='2023-07-15', amount=3556, description='FooBar Enterprises1', source='Bank of Foo'))
            self.db.add_transaction(Transaction(date='2023-07-16', amount=3656, description='FooBar Enterprises2', source='Bank of Foo'))
            self.db.add_transaction(Transaction(date='2023-07-17', amount=3756, description='FooBar Enterprises3', source='Bank of Foo'))
            self.db.add_transaction(Transaction(date='2023-07-18', amount=3856, description='FooBar Enterprises4', source='Bank of Foo'))
        response = self.client.get(f'/api/transaction/?start=2023-07-15&end=2023-07-18&limit=3')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['total'], 4)
        txns = response.json()['transactions']
        self.assertEqual(len(txns), 3)
        self.assertEqual(txns[0]['amount'], 3856)
        self.assertEqual(txns[1]['amount'], 3756)
        self.assertEqual(txns[2]['amount'], 3656)

    def test_get_limit_offset_transactions(self) -> None:
        with self.db:
            self.db.add_transaction(Transaction(date='2023-07-15', amount=3556, description='FooBar Enterprises1', source='Bank of Foo'))
            self.db.add_transaction(Transaction(date='2023-07-16', amount=3656, description='FooBar Enterprises2', source='Bank of Foo'))
            self.db.add_transaction(Transaction(date='2023-07-17', amount=3756, description='FooBar Enterprises3', source='Bank of Foo'))
            self.db.add_transaction(Transaction(date='2023-07-18', amount=3856, description='FooBar Enterprises4', source='Bank of Foo'))
        response = self.client.get(f'/api/transaction/?start=2023-07-15&end=2023-07-18&limit=3&offset=2&sort_order=asc')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['total'], 4)
        txns = response.json()['transactions']
        self.assertEqual(len(txns), 2)
        self.assertEqual(txns[0]['amount'], 3756)
        self.assertEqual(txns[1]['amount'], 3856)

    def test_get_existing_allocations(self) -> None:
        with self.db:
            txn = self.db.add_transaction(Transaction(date='2021-07-18', amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            self.db.add_transaction(Transaction(date='2021-07-17', amount=125, description='123 Inc', source='Bank of Bar'))
            self.db.add_transaction(Transaction(date='2021-07-20', amount=13305, description='Qwerty Corp', source='Bank of Foo'))
        resp = self.client.get(f"/api/allocation/?start=2021-01-01&end=2021-07-19")
        self.assertEqual(resp.status_code, 200)
        alloc_list = resp.json()['allocations']
        self.assertEqual(len(alloc_list), 2)
        for alloc in alloc_list:
            self.assertGreater(alloc['id'], 0)
            self.assertGreater(alloc['txn_id'], 0)
            self.assertEqual(alloc['category'], 'Unknown')
            self.assertEqual(alloc['location'], 'Unknown')
            if alloc['txn_id'] == txn.id:
                self.assertEqual(alloc['date'], '2021-07-18')
                self.assertEqual(alloc['amount'], 3456)
            else:
                self.assertEqual(alloc['date'], '2021-07-17')
                self.assertEqual(alloc['amount'], 125)

    def test_update_an_allocation_category(self) -> None:
        txn_response = self.client.post('/api/transaction/', json={
            'date': '2023-05-23',
            'amount': 9932,
            'description': 'test_update_an_allocation_category',
            'source': 'test update an allocation category',
        })
        resp = self.client.get(f'/api/allocation/?txn={txn_response.json()["id"]}')
        self.assertEqual(resp.status_code, 200)
        alloc_list = resp.json()['allocations']
        self.assertEqual(len(alloc_list), 1)
        alloc = alloc_list[0]
        alloc['category'] = 'Medical'
        put_resp = self.client.put('/api/allocation/', json=alloc)
        self.assertEqual(put_resp.status_code, 200)
        resp = self.client.get(f'/api/allocation/?txn={txn_response.json()["id"]}')
        self.assertEqual(resp.status_code, 200)
        alloc_list = resp.json()['allocations']
        self.assertEqual(len(alloc_list), 1)
        alloc = alloc_list[0]
        self.assertEqual(alloc['category'], 'Medical')
        self.assertEqual(alloc['location'], 'Unknown')
        self.assertIsNone(alloc['note'])

    def test_update_an_allocation_location(self) -> None:
        txn_response = self.client.post('/api/transaction/', json={
            'date': '2023-05-13',
            'amount': 9932,
            'description': 'test_update_an_allocation_location',
            'source': 'test update an allocation location',
        })
        self.assertEqual(txn_response.status_code, 201)
        resp = self.client.get(f'/api/allocation/?txn={txn_response.json()["id"]}')
        self.assertEqual(resp.status_code, 200)
        alloc_list = resp.json()['allocations']
        self.assertEqual(len(alloc_list), 1)
        alloc = alloc_list[0]
        alloc['location'] = 'Mcdonald\'s'
        put_resp = self.client.put('/api/allocation/', json=alloc)
        self.assertEqual(put_resp.status_code, 200)
        resp = self.client.get(f'/api/allocation/?txn={txn_response.json()["id"]}')
        self.assertEqual(resp.status_code, 200)
        alloc_list = resp.json()['allocations']
        self.assertEqual(len(alloc_list), 1)
        alloc = alloc_list[0]
        self.assertEqual(alloc['category'], 'Unknown')
        self.assertEqual(alloc['location'], 'Mcdonald\'s')
        self.assertIsNone(alloc['note'])

    def test_update_an_allocation_note(self) -> None:
        txn_response = self.client.post('/api/transaction/', json={
            'date': '2023-05-19',
            'amount': 9932,
            'description': 'test_update_an_allocation_note',
            'source': 'test update an allocation note',
        })
        self.assertEqual(txn_response.status_code, 201)
        resp = self.client.get(f'/api/allocation/?txn={txn_response.json()["id"]}')
        self.assertEqual(resp.status_code, 200)
        alloc_list = resp.json()['allocations']
        self.assertEqual(len(alloc_list), 1)
        alloc = alloc_list[0]
        alloc['note'] = 'Hi there'
        put_resp = self.client.put('/api/allocation/', json=alloc)
        self.assertEqual(put_resp.status_code, 200)
        resp = self.client.get(f'/api/allocation/?txn={txn_response.json()["id"]}')
        self.assertEqual(resp.status_code, 200)
        alloc_list = resp.json()['allocations']
        self.assertEqual(len(alloc_list), 1)
        alloc = alloc_list[0]
        self.assertEqual(alloc['category'], 'Unknown')
        self.assertEqual(alloc['location'], 'Unknown')
        self.assertEqual(alloc['note'], 'Hi there')

    def test_split_an_allocation(self) -> None:
        txn_response = self.client.post('/api/transaction/', json={
            'date': '2023-05-01',
            'amount': 9932,
            'description': 'test_split_an_allocation',
            'source': 'test split an allocation',
        })
        self.assertEqual(txn_response.status_code, 201)
        resp = self.client.get(f'/api/allocation/?txn={txn_response.json()["id"]}')
        self.assertEqual(resp.status_code, 200)
        alloc_list = resp.json()['allocations']
        self.assertEqual(len(alloc_list), 1)
        alloc = alloc_list[0]
        response = self.client.put(f'/api/allocation/{alloc["id"]}/split', json={'amount': 1234})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['amount'], 1234)
        resp = self.client.get(f'/api/allocation/?txn={txn_response.json()["id"]}')
        self.assertEqual(resp.status_code, 200)
        alloc_list = resp.json()['allocations']
        self.assertEqual(len(alloc_list), 2)
        self.assertEqual(alloc_list[0]['amount'], 8698)
        self.assertEqual(alloc_list[1]['amount'], 1234)

    def test_merge_allocations(self) -> None:
        txn_response = self.client.post('/api/transaction/', json={
            'date': '2023-06-01',
            'amount': 9932,
            'description': 'test_merge_an_allocation',
            'source': 'FooBar Bank',
        })
        self.assertEqual(txn_response.status_code, 201)
        resp = self.client.get(f'/api/allocation/?txn={txn_response.json()["id"]}')
        self.assertEqual(resp.status_code, 200)
        alloc_list = resp.json()['allocations']
        self.assertEqual(len(alloc_list), 1)
        alloc = alloc_list[0]
        response = self.client.put(f'/api/allocation/{alloc["id"]}/split', json={'amount': 1234})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['amount'], 1234)
        resp = self.client.get(f'/api/allocation/?txn={txn_response.json()["id"]}')
        self.assertEqual(resp.status_code, 200)
        alloc_list = resp.json()['allocations']
        self.assertEqual(alloc_list[0]['amount'], 8698)
        self.assertEqual(alloc_list[1]['amount'], 1234)
        response = self.client.put(f'/api/allocation/{alloc_list[0]["id"]}/merge', json=[alloc_list[1]["id"]])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['amount'], 9932)
        resp = self.client.get(f'/api/allocation/?txn={txn_response.json()["id"]}')
        self.assertEqual(resp.status_code, 200)
        alloc_list = resp.json()['allocations']
        self.assertEqual(len(alloc_list), 1)

    def test_throws_on_merge_allocations_fail(self) -> None:
        with self.assertRaises(ValueError):
            self.client.put(f'/api/allocation/10000/merge', json=[223423, 34353452])

    def test_failed_with_corrupt_token(self) -> None:
        self.client.headers.update({'Authorization': 'Bearer foobar'})
        resp = self.client.get(f'/api/transaction/?query=id>0')
        self.assertEqual(resp.status_code, 401)

    def test_failed_with_unknown_name(self) -> None:
        self.client.headers.update({'Authorization': f'Bearer {create_token("qwerty").access_token}'})
        resp = self.client.get(f'/api/transaction/?query=id>0')
        self.assertEqual(resp.status_code, 401)

    def test_login(self) -> None:
        secrets['users']['foo'] = {
            "api": "rw",
            "hash": hash_password('bar')
        }
        form_data = {
            'username': 'foo',
            'password': 'bar',
            'grant_type': 'password'
        }
        response = self.client.post(
            '/api/oauth2/token/',
            data=form_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        result = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(result.get('token_type'), 'bearer')
        self.assertIn('access_token', result)

    def test_failed_login(self) -> None:
        form_data = {
            'username': 'Ivy',
            'password': 'hello',
            'grant_type': 'password'
        }
        response = self.client.post(
            '/api/oauth2/token/',
            data=form_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        self.assertEqual(response.status_code, 401)

    def test_refresh_token(self) -> None:
        secrets['users']['foo'] = {
            "api": "rw",
            "hash": hash_password('bar')
        }
        form_data = {
            'username': 'foo',
            'password': 'bar',
            'grant_type': 'password'
        }
        response = self.client.post(
            '/api/oauth2/token/',
            data=form_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result.get('token_type'), 'bearer')
        self.assertIn('access_token', result)
        self.assertIn('refresh_token', result)

        form_data = {
            'refresh_token': result['refresh_token'],
            'grant_type': 'refresh_token'
        }
        response = self.client.post(
            '/api/oauth2/token/',
            data=form_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result['token_type'], 'bearer')
        self.assertTrue(result['access_token'])
        self.assertTrue(result['refresh_token'])

    def test_refresh_token_can_be_used_only_once(self) -> None:
        secrets['users']['foo'] = {
            "api": "rw",
            "hash": hash_password('bar')
        }
        form_data = {
            'username': 'foo',
            'password': 'bar',
            'grant_type': 'password'
        }
        response = self.client.post(
            '/api/oauth2/token/',
            data=form_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result.get('token_type'), 'bearer')
        self.assertIn('access_token', result)
        self.assertIn('refresh_token', result)

        form_data = {
            'refresh_token': result['refresh_token'],
            'grant_type': 'refresh_token'
        }
        time.sleep(1)
        response = self.client.post(
            '/api/oauth2/token/',
            data=form_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        self.assertEqual(response.status_code, 200)
        result2 = response.json()
        self.assertEqual(result2['token_type'], 'bearer')
        self.assertTrue(result2['access_token'])
        self.assertTrue(result2['refresh_token'])

        response = self.client.post(
            '/api/oauth2/token/',
            data=form_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        self.assertEqual(response.status_code, 401)

    def test_logout_clears_token(self) -> None:
        secrets['users']['foo'] = {
            "api": "rw",
            "hash": hash_password('bar')
        }
        form_data = {
            'username': 'foo',
            'password': 'bar',
            'grant_type': 'password'
        }
        response = self.client.post(
            '/api/oauth2/token/',
            data=form_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result.get('token_type'), 'bearer')
        self.assertIn('access_token', result)
        self.assertIn('refresh_token', result)

        form_data = {
            'refresh_token': result['refresh_token'],
            'grant_type': 'refresh_token'
        }
        response = self.client.post(
            '/api/oauth2/logout/',
            data=form_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        self.assertEqual(response.status_code, 204)

        response = self.client.post(
            '/api/oauth2/token/',
            data=form_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        self.assertEqual(response.status_code, 401)

    def test_check_token_is_valid(self) -> None:
        secrets['users']['foo'] = {
            "api": "rw",
            "hash": hash_password('bar')
        }
        self.client.headers.update({'Authorization': f'Bearer {create_token("foo").access_token}'})
        resp = self.client.get(f'/api/oauth2/token/')
        self.assertEqual(resp.status_code, 204)

        self.client.headers.update({'Authorization': f'Bearer {create_token("qwerty").access_token}'})
        resp = self.client.get(f'/api/oauth2/token/')
        self.assertEqual(resp.status_code, 401)


unittest.main()
