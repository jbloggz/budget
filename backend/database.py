#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# database.py: This file implements a wrapper around a SQLite database
#

# System imports
import os
import sqlite3
from typing import List, Dict, Optional, Any

# Local imports
from model import Transaction, Allocation


class Database:
    '''
    A class that abstracts the interaction with the SQLite database
    '''
    DB_PATH = os.environ.get('DB_PATH') or './budget.db'

    def __enter__(self):
        self.con = sqlite3.connect(Database.DB_PATH)
        self.db = self.con.cursor()
        with open('schema.sql') as fp:
            schema = fp.read()
            self.db.executescript(schema)
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.db.close()
        self.con.commit()
        self.con.close()

    def get_tables(self) -> List[str]:
        '''
        Get a list of all the sql tables in the database
        '''
        self.db.execute('SELECT name FROM sqlite_master WHERE type=\'table\'')
        return [v[0] for v in self.db.fetchall()]

    def get_fields(self, table: str) -> List[str]:
        '''
        Get a list of all the fields for a given table
        '''
        self.db.execute('SELECT name FROM pragma_table_info(?)', (table, ))
        return [v[0] for v in self.db.fetchall()]

    def set_setting(self, key: str, value: str) -> None:
        '''
        Insert a setting option

        Args:
            key:   The setting key
            value: The setting value
        '''
        self.db.execute('INSERT INTO setting VALUES (?, ?) ON CONFLICT DO UPDATE SET value = ?', (key, value, value))

    def get_setting(self, key: str) -> str:
        '''
        Get a setting option

        Args:
            key:   The setting key

        Returns:
            The setting value
        '''
        self.db.execute('SELECT VALUE FROM setting WHERE key = ?', (key, ))
        res = self.db.fetchone()
        return res[0] if res else None

    def clear_setting(self, key: str) -> None:
        '''
        Remove a setting option

        Args:
            key:   The setting key
        '''
        self.db.execute('DELETE FROM setting WHERE key = ?', (key, ))

    def add_transaction(self, txn: Transaction) -> Transaction:
        '''
        Add a new transaction

        Args:
            txn:   The transaction to add

        Returns:
            The transaction with the ID filled in
        '''
        self.db.execute('INSERT INTO txn VALUES (NULL, ?, ?, ?, ?)', (txn.time, txn.amount, txn.description, txn.source))
        txn.id = self.db.lastrowid
        self.db.execute('INSERT INTO allocation VALUES (NULL, ?, ?, 1, 1, NULL)', (txn.amount, txn.id))
        return txn

    def get_transaction_list(self, expr: str) -> List[Transaction]:
        '''
        Get list of transaction based on a filter expression

        Args:
            filter: An SQL filter expression

        Returns:
            A list of transactions that match the filter
        '''
        self.db.execute(f'SELECT id, time, amount, description, source FROM txn WHERE {expr}')
        res = []
        for row in self.db:
            res.append(Transaction(
                id=row[0],
                time=row[1],
                amount=row[2],
                description=row[3],
                source=row[4],
            ))
        return res

    def get_transaction(self, txn_id: int) -> Optional[Transaction]:
        '''
        Get an existing transaction

        Args:
            txn_id: The transaction ID

        Returns:
            The transaction, or None if the id is invalid
        '''
        txn_list = self.get_transaction_list(f'id = {txn_id}')
        return txn_list[0] if txn_list else None

    def get_categories(self) -> Dict[str, int]:
        '''
        Get the mapping of category names the their ID's

        Returns:
            A dictionary of the categories
        '''
        self.db.execute(f'SELECT id, name FROM category')
        res = {}
        for row in self.db:
            res[row[1]] = row[0]
        return res

    def get_locations(self) -> Dict[str, int]:
        '''
        Get the mapping of location names the their ID's

        Returns:
            A dictionary of the locations
        '''
        self.db.execute(f'SELECT id, name FROM location')
        res = {}
        for row in self.db:
            res[row[1]] = row[0]
        return res

    def get_allocation_list(self, expr: str) -> List[Allocation]:
        '''
        Get list of allocations based on a filter expression

        Args:
            filter: An SQL filter expression

        Returns:
            A list of allocations that match the filter
        '''
        self.db.execute(f'''SELECT allocation.id as id, allocation.txn_id as txn_id, txn.time as time, allocation.amount as amount, category.name as category, location.name as location, allocation.note as note
                            FROM allocation
                            LEFT JOIN category ON category_id = category.id
                            LEFT JOIN location ON location_id = location.id
                            LEFT JOIN txn ON txn_id = txn.id
                            WHERE {expr}''')
        res = []
        for row in self.db:
            res.append(Allocation(
                id=row[0],
                txn_id=row[1],
                time=row[2],
                amount=row[3],
                category=row[4],
                location=row[5],
                note=row[6],
            ))
        return res

    def get_allocation(self, alloc_id: int) -> Optional[Allocation]:
        '''
        Get an existing allocation

        Args:
            alloc_id: The allocation ID

        Returns:
            The allocation, or None if alloc_id is invalid
        '''
        alloc_list = self.get_allocation_list(f'allocation.id = {alloc_id}')
        return alloc_list[0] if alloc_list else None

    def update_allocation(self, alloc_id: int, category: str = None, location: str = None, note: str = None) -> None:
        '''
        Update the category and location for an existing allocation

        Args:
            alloc_id: The allocation ID
            category: The new category
            location: The new location
            location: A note for the allocation
        '''
        categories = self.get_categories()
        if category is None:
            category_id = None
        elif category not in categories:
            self.db.execute(f'INSERT INTO category VALUES (NULL, ?)', (category, ))
            category_id = self.db.lastrowid
        else:
            category_id = categories[category]
        locations = self.get_locations()
        if location is None:
            location_id = None
        elif location not in locations:
            self.db.execute(f'INSERT INTO location VALUES (NULL, ?)', (location, ))
            location_id = self.db.lastrowid
        else:
            location_id = locations[location]
        self.db.execute(f'UPDATE allocation SET category_id = IFNULL(?, category_id), location_id = IFNULL(?, location_id), note = IFNULL(?, note) WHERE id = ?',
                        (category_id, location_id, note, alloc_id))

    def split_allocation(self, alloc_id: int, amount: int) -> int:
        '''
        Split an allocation by creating a second allocation that takes some of the amount

        Args:
            alloc_id: The allocation ID
            amount:   The amount to split off in cents
        '''
        alloc = self.get_allocation(alloc_id)
        if alloc is None:
            raise ValueError('Invalid allocaction')
        if amount >= alloc.amount or amount <= 0:
            raise ValueError('Invalid amount to split from allocation')
        self.db.execute('INSERT INTO allocation VALUES (NULL, ?, ?, 1, 1, NULL)', (amount, alloc.txn_id))
        res = self.db.lastrowid
        self.db.execute('UPDATE allocation SET amount = ? WHERE id = ?', (alloc.amount - amount, alloc_id))
        return res
