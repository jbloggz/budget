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
    def test_tables(self):
        self.assertEqual(set(db.get_tables()), {'txn', 'category', 'location', 'allocation'})

    def test_txn_fields(self):
        self.assertEqual(set(db.get_fields('txn')), {'id', 'time', 'amount', 'description', 'source'})

    def test_category_fields(self):
        self.assertEqual(set(db.get_fields('category')), {'id', 'name'})

    def test_location_fields(self):
        self.assertEqual(set(db.get_fields('location')), {'id', 'name'})

    def test_allocation_fields(self):
        self.assertEqual(set(db.get_fields('allocation')), {'id', 'txn_id', 'location_id', 'category_id', 'amount'})


class TestAPI(unittest.TestCase):
    def test_hello(self):
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"Hello": "World"})


if __name__ == '__main__':
    unittest.main()
