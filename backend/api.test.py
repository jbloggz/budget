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


class TestAPI(unittest.TestCase):
    def test_hello(self) -> None:
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"Hello": "World"})


if __name__ == '__main__':
    unittest.main()
