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
from model import Transaction
from auth import secrets, hash_password, create_token


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

    def test_get_category_id(self):
        with db:
            self.assertEqual(db.get_category_id('Unknown'), 1)
            self.assertGreater(db.get_category_id('Zapsticle'), 1)

    def test_get_location_id(self):
        with db:
            self.assertEqual(db.get_location_id('Unknown'), 1)
            self.assertGreater(db.get_location_id('AlCM'), 1)

    def test_update_allocation(self) -> None:
        with db:
            txn = db.add_transaction(Transaction(time=1684670193, amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = db.get_allocation_list(f'txn_id = {txn.id}')
            self.assertEqual(len(alloc_list), 1)
            assert alloc_list[0].id is not None

            alloc_list[0].category = 'Foo'
            alloc_list[0].location = 'Foo Inc'
            db.update_allocation(alloc_list[0])
            alloc = db.get_allocation(alloc_list[0].id)
            self.assertIsNotNone(alloc)
            assert alloc is not None
            self.assertEqual(alloc.amount, 3456)
            self.assertEqual(alloc.txn_id, txn.id)
            self.assertEqual(alloc.category, 'Foo')
            self.assertEqual(alloc.location, 'Foo Inc')
            assert alloc_list[0].id is not None

            alloc_list[0].category = 'Bar'
            alloc_list[0].location = 'Bar Inc'
            db.update_allocation(alloc_list[0])
            alloc = db.get_allocation(alloc_list[0].id)
            assert alloc is not None
            self.assertEqual(alloc.category, 'Bar')
            self.assertEqual(alloc.location, 'Bar Inc')
            assert alloc_list[0].id is not None

            alloc_list[0].location = 'Foo Inc'
            db.update_allocation(alloc_list[0])
            alloc = db.get_allocation(alloc_list[0].id)
            assert alloc is not None
            self.assertEqual(alloc.category, 'Bar')
            self.assertEqual(alloc.location, 'Foo Inc')

            alloc_list[0].category = 'Foo'
            db.update_allocation(alloc_list[0])
            alloc = db.get_allocation(alloc_list[0].id)
            assert alloc is not None
            self.assertEqual(alloc.category, 'Foo')
            self.assertEqual(alloc.location, 'Foo Inc')

    def test_update_allocation_note(self) -> None:
        with db:
            txn = db.add_transaction(Transaction(time=1684670193, amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = db.get_allocation_list(f'txn_id = {txn.id}')
            self.assertEqual(len(alloc_list), 1)
            assert alloc_list[0].id is not None
            alloc_list[0].note = 'A little note from the heart'
            alloc_list[0].category = 'Shopping'
            db.update_allocation(alloc_list[0])
            alloc = db.get_allocation(alloc_list[0].id)
            assert alloc is not None
            self.assertEqual(alloc.amount, 3456)
            self.assertEqual(alloc.txn_id, txn.id)
            self.assertEqual(alloc.category, 'Shopping')
            self.assertEqual(alloc.location, 'Unknown')
            self.assertEqual(alloc.note, 'A little note from the heart')

    def test_refuses_to_update_allocation_txn_id_and_amount(self) -> None:
        with db:
            txn = db.add_transaction(Transaction(time=1684670193, amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = db.get_allocation_list(f'txn_id = {txn.id}')
            self.assertEqual(len(alloc_list), 1)
            assert alloc_list[0].id is not None
            alloc_list[0].txn_id = 1234
            alloc_list[0].amount = 999999
            db.update_allocation(alloc_list[0])
            alloc = db.get_allocation(alloc_list[0].id)
            assert alloc is not None
            self.assertEqual(alloc.amount, 3456)
            self.assertEqual(alloc.txn_id, txn.id)
            self.assertEqual(alloc.category, 'Unknown')
            self.assertEqual(alloc.location, 'Unknown')
            self.assertIsNone(alloc.note)

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

    def test_merge_allocations(self) -> None:
        with db:
            txn = db.add_transaction(Transaction(time=1684670193, amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = db.get_allocation_list(f'txn_id = {txn.id}')
            self.assertEqual(len(alloc_list), 1)
            assert alloc_list[0].id is not None
            db.split_allocation(alloc_list[0].id, 1234)
            alloc_list = db.get_allocation_list(f'txn_id = {txn.id}')
            self.assertEqual(len(alloc_list), 2)
            assert alloc_list[0].id is not None
            self.assertEqual(alloc_list[0].amount, 2222)
            self.assertEqual(alloc_list[1].amount, 1234)
            assert alloc_list[0].id is not None
            assert alloc_list[1].id is not None
            db.merge_allocations([alloc_list[0].id, alloc_list[1].id])
            alloc_list = db.get_allocation_list(f'txn_id = {txn.id}')
            self.assertEqual(len(alloc_list), 1)
            self.assertEqual(alloc_list[0].amount, 3456)

    def test_throws_if_merge_no_allocations(self) -> None:
        with db:
            with self.assertRaises(ValueError):
                db.merge_allocations([12938, 92387423])

    def test_no_op_if_merge_single_allocation(self) -> None:
        with db:
            txn = db.add_transaction(Transaction(time=1684670193, amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            alloc_list = db.get_allocation_list(f'txn_id = {txn.id}')
            self.assertEqual(len(alloc_list), 1)
            self.assertEqual(alloc_list[0].amount, 3456)
            assert alloc_list[0].id is not None
            db.merge_allocations([alloc_list[0].id])
            alloc_list = db.get_allocation_list(f'txn_id = {txn.id}')
            self.assertEqual(alloc_list[0].amount, 3456)
            self.assertEqual(len(alloc_list), 1)

    def test_throws_if_merge_invalid_allocations(self) -> None:
        with db:
            txn1 = db.add_transaction(Transaction(time=1684670193, amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            txn2 = db.add_transaction(Transaction(time=1684671193, amount=3456, description='FooBar Enterprises', source='Bank of Foo'))
            assert txn1.id is not None
            assert txn2.id is not None
            alloc_list = db.get_allocation_list(f'txn_id IN ({txn1.id},{txn2.id})')
            assert len(alloc_list) == 2
            assert alloc_list[0].id is not None
            assert alloc_list[1].id is not None
            with self.assertRaises(ValueError):
                db.merge_allocations([alloc_list[0].id, alloc_list[1].id])


class TestAPI(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)
        secrets['users']['foo'] = hash_password('bar')
        form_data = {'username': 'foo', 'password': 'bar'}
        response = self.client.post("/login/", data=form_data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
        self.token = response.json()['access_token']
        self.client.headers.update({'Authorization': f'Bearer {self.token}'})

    def test_add_a_transaction(self) -> None:
        response = self.client.post("/transaction/", json={
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
        response = self.client.get(f'/transaction/?query=id={txn.id}')
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
        response = self.client.get(f'/allocation/?query=time<1584672000')
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

    def test_update_an_allocation_category(self) -> None:
        txn_response = self.client.post("/transaction/", json={
            'time': 1685019387,
            'amount': 9932,
            'description': 'test_update_an_allocation_category',
            'source': 'coescijsoeicj',
        })
        self.assertEqual(txn_response.status_code, 201)
        alloc_list = self.client.get(f'/allocation/?query=description=\'test_update_an_allocation_category\'')
        self.assertEqual(alloc_list.status_code, 200)
        self.assertEqual(len(alloc_list.json()), 1)
        alloc = alloc_list.json()[0]
        alloc['category'] = 'Medical'
        response = self.client.put("/allocation/", json=alloc)
        self.assertEqual(response.status_code, 200)
        alloc_list = self.client.get(f'/allocation/?query=description=\'test_update_an_allocation_category\'')
        self.assertEqual(alloc_list.status_code, 200)
        self.assertEqual(len(alloc_list.json()), 1)
        self.assertEqual(alloc_list.json()[0]['category'], 'Medical')
        self.assertEqual(alloc_list.json()[0]['location'], 'Unknown')
        self.assertIsNone(alloc_list.json()[0]['note'])

    def test_update_an_allocation_location(self) -> None:
        txn_response = self.client.post("/transaction/", json={
            'time': 1685019387,
            'amount': 9932,
            'description': 'test_update_an_allocation_location',
            'source': 'coescijsoeicj',
        })
        self.assertEqual(txn_response.status_code, 201)
        alloc_list = self.client.get(f'/allocation/?query=description=\'test_update_an_allocation_location\'')
        self.assertEqual(alloc_list.status_code, 200)
        self.assertEqual(len(alloc_list.json()), 1)
        alloc = alloc_list.json()[0]
        alloc['location'] = 'Mcdonalds'
        response = self.client.put("/allocation/", json=alloc)
        self.assertEqual(response.status_code, 200)
        alloc_list = self.client.get(f'/allocation/?query=description=\'test_update_an_allocation_location\'')
        self.assertEqual(alloc_list.status_code, 200)
        self.assertEqual(len(alloc_list.json()), 1)
        self.assertEqual(alloc_list.json()[0]['category'], 'Unknown')
        self.assertEqual(alloc_list.json()[0]['location'], 'Mcdonalds')
        self.assertIsNone(alloc_list.json()[0]['note'])

    def test_update_an_allocation_note(self) -> None:
        txn_response = self.client.post("/transaction/", json={
            'time': 1685019387,
            'amount': 9932,
            'description': 'test_update_an_allocation_note',
            'source': 'coescijsoeicj',
        })
        self.assertEqual(txn_response.status_code, 201)
        alloc_list = self.client.get(f'/allocation/?query=description=\'test_update_an_allocation_note\'')
        self.assertEqual(alloc_list.status_code, 200)
        self.assertEqual(len(alloc_list.json()), 1)
        alloc = alloc_list.json()[0]
        alloc['note'] = 'Hi there'
        response = self.client.put("/allocation/", json=alloc)
        self.assertEqual(response.status_code, 200)
        alloc_list = self.client.get(f'/allocation/?query=description=\'test_update_an_allocation_note\'')
        self.assertEqual(alloc_list.status_code, 200)
        self.assertEqual(len(alloc_list.json()), 1)
        self.assertEqual(alloc_list.json()[0]['category'], 'Unknown')
        self.assertEqual(alloc_list.json()[0]['location'], 'Unknown')
        self.assertEqual(alloc_list.json()[0]['note'], 'Hi there')

    def test_split_an_allocation(self) -> None:
        txn_response = self.client.post("/transaction/", json={
            'time': 1685019387,
            'amount': 9932,
            'description': 'test_split_an_allocation',
            'source': 'coescijsoeicj',
        })
        self.assertEqual(txn_response.status_code, 201)
        alloc_list = self.client.get(f'/allocation/?query=description=\'test_split_an_allocation\'')
        self.assertEqual(alloc_list.status_code, 200)
        self.assertEqual(len(alloc_list.json()), 1)
        alloc = alloc_list.json()[0]
        response = self.client.get(f"/allocation/split?id={alloc['id']}&amount=1234")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['amount'], 1234)
        alloc_list = self.client.get(f"/allocation/?query=txn_id={txn_response.json()['id']}")
        self.assertEqual(alloc_list.status_code, 200)
        self.assertEqual(len(alloc_list.json()), 2)
        self.assertEqual(alloc_list.json()[0]['amount'], 8698)
        self.assertEqual(alloc_list.json()[1]['amount'], 1234)

    def test_merge_allocations(self) -> None:
        txn_response = self.client.post("/transaction/", json={
            'time': 1685019387,
            'amount': 9932,
            'description': 'test_merge_an_allocation',
            'source': 'coescijsoeicj',
        })
        self.assertEqual(txn_response.status_code, 201)
        alloc_list = self.client.get(f'/allocation/?query=description=\'test_merge_an_allocation\'')
        self.assertEqual(alloc_list.status_code, 200)
        self.assertEqual(len(alloc_list.json()), 1)
        alloc = alloc_list.json()[0]
        response = self.client.get(f"/allocation/split?id={alloc['id']}&amount=1234")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['amount'], 1234)
        alloc_list = self.client.get(f"/allocation/?query=txn_id={txn_response.json()['id']}")
        self.assertEqual(alloc_list.status_code, 200)
        self.assertEqual(len(alloc_list.json()), 2)
        self.assertEqual(alloc_list.json()[0]['amount'], 8698)
        self.assertEqual(alloc_list.json()[1]['amount'], 1234)
        response = self.client.get(f"/allocation/merge/?ids={alloc_list.json()[0]['id']}&ids={alloc_list.json()[1]['id']}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['amount'], 9932)
        alloc_list = self.client.get(f"/allocation/?query=txn_id={txn_response.json()['id']}")
        self.assertEqual(alloc_list.status_code, 200)
        self.assertEqual(len(alloc_list.json()), 1)

    def test_throws_on_merge_allocations_fail(self) -> None:
        with self.assertRaises(ValueError):
            self.client.get(f"/allocation/merge/?ids=10000&ids=223423&ids=34353452")

    def test_failed_with_corrupt_token(self) -> None:
        self.client.headers.update({'Authorization': 'Bearer foobar'})
        resp = self.client.get(f"/transaction/?query=id>0")
        self.assertEqual(resp.status_code, 401)

    def test_failed_with_unknown_name(self) -> None:
        self.client.headers.update({'Authorization': f'Bearer {create_token("qwerty").access_token}'})
        resp = self.client.get(f'/transaction/?query=id>0')
        self.assertEqual(resp.status_code, 401)

    def test_login(self) -> None:
        secrets['users']['foo'] = hash_password('bar')
        form_data = {
            'username': 'foo',
            'password': 'bar'
        }
        response = self.client.post(
            "/login/",
            data=form_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        result = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(result['token_type'], 'bearer')
        self.assertTrue(result['access_token'])

    def test_failed_login(self) -> None:
        form_data = {
            'username': 'Ivy',
            'password': 'hello'
        }
        response = self.client.post(
            "/login/",
            data=form_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        self.assertEqual(response.status_code, 401)


unittest.main()
