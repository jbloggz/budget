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


class TestDatabase(unittest.TestCase):
    def setUp(self) -> None:
        self.db = Database()
        return super().setUp()

    def test_tables(self) -> None:
        self.assertEqual(set(self.db.get_tables()), {'setting', 'txn', 'category', 'location', 'allocation'})

    def test_setting_fields(self) -> None:
        self.assertEqual(set(self.db.get_fields('setting')), {'key', 'value'})

    def test_txn_fields(self) -> None:
        self.assertEqual(set(self.db.get_fields('txn')), {'id', 'time', 'amount', 'description', 'source'})

    def test_category_fields(self) -> None:
        self.assertEqual(set(self.db.get_fields('category')), {'id', 'name'})

    def test_location_fields(self) -> None:
        self.assertEqual(set(self.db.get_fields('location')), {'id', 'name'})

    def test_allocation_fields(self) -> None:
        self.assertEqual(set(self.db.get_fields('allocation')), {'id', 'txn_id', 'location_id', 'category_id', 'amount'})

    def test_create_setting(self) -> None:
        self.db.set_setting('interval', 'monthly')
        self.assertEqual(self.db.get_setting('interval'), 'monthly')

    def test_clear_setting(self) -> None:
        self.db.set_setting('interval', 'monthly')
        self.db.set_setting('foo', 'bar')
        self.assertEqual(self.db.get_setting('interval'), 'monthly')
        self.db.clear_setting('interval')
        self.assertEqual(self.db.get_setting('interval'), None)
        self.assertEqual(self.db.get_setting('foo'), 'bar')

    def test_update_setting(self) -> None:
        self.db.set_setting('interval', 'monthly')
        self.db.set_setting('foo', 'bar')
        self.assertEqual(self.db.get_setting('interval'), 'monthly')
        self.db.set_setting('interval', 'weekly')
        self.assertEqual(self.db.get_setting('interval'), 'weekly')
        self.assertEqual(self.db.get_setting('foo'), 'bar')

    def test_add_transaction(self) -> None:
        txn_id = self.db.add_transaction(1684670193, 34.56, 'FooBar Enterprises', 'Bank of Foo')
        txn = self.db.get_transaction(txn_id)
        self.assertIsNotNone(txn)
        if txn is not None:
            self.assertEqual(txn['time'], 1684670193)
            self.assertEqual(txn['amount'], 34.56)
            self.assertEqual(txn['description'], 'FooBar Enterprises')
            self.assertEqual(txn['source'], 'Bank of Foo')

    def test_get_invalid_transaction(self) -> None:
        txn = self.db.get_transaction(1234)
        self.assertEqual(txn, None)

    def test_get_transaction_list(self) -> None:
        self.db.add_transaction(1684670193, 34.56, 'FooBar Enterprises', 'Bank of Foo')
        self.db.add_transaction(1684680193, 123.34, 'Qwerty Inc', 'Bank of Foo')
        self.db.add_transaction(1684690193, 9382.30, 'FooBar Enterprises', 'Bank of Foo')
        self.db.add_transaction(1684700193, 291.2, 'FooBar Enterprises', 'Bank of Foo')
        txn_list = self.db.get_transaction_list('description = \'FooBar Enterprises\'')
        self.assertEqual(len(txn_list), 3)


class TestAPI(unittest.TestCase):
    def test_hello(self) -> None:
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"Hello": "World"})


if __name__ == '__main__':
    unittest.main()
