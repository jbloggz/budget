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
from typing import List, Optional, Tuple
import time

# Local imports
from model import Transaction, Allocation


class Database:
    '''
    A class that abstracts the interaction with the SQLite database
    '''
    DB_PATH = os.environ.get('DB_PATH') or './budget.db'

    def __enter__(self):
        self.open()
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.close()

    def open(self):
        self.con = sqlite3.connect(Database.DB_PATH)
        self.db = self.con.cursor()
        with open('schema.sql') as fp:
            schema = fp.read()
            self.db.executescript(schema)
        return self

    def close(self):
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

    def add_token(self, value: str, expire: int) -> None:
        self.db.execute('INSERT OR IGNORE INTO token VALUES (?, ?)', (value, expire))

    def clear_token(self, value: str) -> None:
        self.db.execute('DELETE FROM token WHERE value = ?', (value,))

    def has_token(self, value: str) -> bool:
        self.db.execute('DELETE FROM token WHERE expire <= ?', (int(time.time()),))
        self.db.execute('SELECT value FROM token WHERE value = ?', (value,))
        return self.db.fetchone() is not None

    def add_transaction(self, txn: Transaction) -> Transaction:
        '''
        Add a new transaction

        Args:
            txn:   The transaction to add

        Returns:
            The transaction with the ID filled in
        '''
        self.db.execute('INSERT INTO txn VALUES (NULL, ?, ?, ?, ?)', (txn.date, txn.amount, txn.description, txn.source))
        txn.id = self.db.lastrowid
        self.db.execute('INSERT INTO allocation VALUES (NULL, ?, ?, 1, 1, NULL)', (txn.amount, txn.id))
        return txn

    def update_transaction(self, txn_id: int, txn: Transaction):
        '''
        Updates an existing transaction

        Args:
            id:  The id to update
            txn: The new details
        '''
        self.db.execute('UPDATE txn set date = ?, amount = ?, description = ?, source = ? WHERE id = ?', (txn.date, txn.amount, txn.description, txn.source, txn_id))

    def get_all_transactions(self) -> List[Transaction]:
        '''
        Get list of transaction based on a filter expression

        Args:
            filter: An SQL filter expression

        Returns:
            A list of transactions that match the filter
        '''
        self.db.execute(f'SELECT id, date, amount, description, source FROM txn')
        res = []
        for row in self.db:
            res.append(Transaction(
                id=row[0],
                date=row[1],
                amount=row[2],
                description=row[3],
                source=row[4],
            ))
        return res

    def get_transaction_list(self, expr: str, params: Optional[Tuple] = ()) -> List[Transaction]:
        '''
        Get list of transaction based on a filter expression

        Args:
            expr:   An SQL filter expression
            params: Optional parameters to the expression

        Returns:
            A list of transactions that match the filter
        '''
        self.db.execute(f'SELECT id, date, amount, description, source FROM txn WHERE {expr}', params)
        res = []
        for row in self.db:
            res.append(Transaction(
                id=row[0],
                date=row[1],
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

    def get_category_id(self, name: str) -> int:
        '''
        Get a category id (creating one if necessary)

        Args:
            name: The name of the category

        Returns:
            The ID of the category
        '''
        self.db.execute(f'INSERT OR IGNORE INTO category VALUES (NULL, ?)', (name, ))
        self.db.execute(f'SELECT id FROM category WHERE name = ?', (name, ))
        row = self.db.fetchone()
        return row[0]

    def get_location_id(self, name: str) -> int:
        '''
        Get a location id (creating one if necessary)

        Args:
            name: The name of the location

        Returns:
            The ID of the location
        '''
        self.db.execute(f'INSERT OR IGNORE INTO location VALUES (NULL, ?)', (name, ))
        self.db.execute(f'SELECT id FROM location WHERE name = ?', (name, ))
        row = self.db.fetchone()
        return row[0]

    def get_allocation_list(self, expr: str) -> List[Allocation]:
        '''
        Get list of allocations based on a filter expression

        Args:
            filter: An SQL filter expression

        Returns:
            A list of allocations that match the filter
        '''
        self.db.execute(f'''SELECT allocation.id as id, allocation.txn_id as txn_id, txn.date as date, allocation.amount as amount, category.name as category, location.name as location, allocation.note as note
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
                date=row[2],
                amount=row[3],
                category=row[4],
                location=row[5],
                note=row[6],
            ))
        return res

    def get_txn_allocations(self, txn_id: int) -> List[Allocation]:
        '''
        Get list of allocations for a transaction

        Args:
            txn_id: The id of a transaction

        Returns:
            A list of allocations
        '''
        self.db.execute(f'''SELECT allocation.id as id, allocation.txn_id as txn_id, txn.date as date, allocation.amount as amount, category.name as category, location.name as location, allocation.note as note
                            FROM allocation
                            LEFT JOIN category ON category_id = category.id
                            LEFT JOIN location ON location_id = location.id
                            LEFT JOIN txn ON txn_id = txn.id
                            WHERE txn_id = ?''', (txn_id, ))
        res = []
        for row in self.db:
            res.append(Allocation(
                id=row[0],
                txn_id=row[1],
                date=row[2],
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

    def update_allocation(self, alloc: Allocation) -> None:
        '''
        Update the category and location and note for an existing allocation.
        The other fields of alloc are ignored

        Args:
            alloc: The allocation
        '''
        category_id = self.get_category_id(alloc.category)
        location_id = self.get_location_id(alloc.location)
        self.db.execute(f'UPDATE allocation SET category_id = ?, location_id = ?, note = ? WHERE id = ?',
                        (category_id, location_id, alloc.note, alloc.id))

    def split_allocation(self, alloc_id: int, amount: int) -> Allocation:
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
        res_id = self.db.lastrowid
        self.db.execute('UPDATE allocation SET amount = ? WHERE id = ?', (alloc.amount - amount, alloc_id))
        res = self.get_allocation(res_id)
        assert res is not None
        return res

    def merge_allocations(self, id_list: List[int]) -> Allocation:
        '''
        Merge multiple allocations into a singel allocation by adding all the ammounts to the first

        Args:
            id_list: The list of allocation IDs

        Returns:
            The merged allocation
        '''
        alloc_list = self.get_allocation_list(f'allocation.id IN ({",".join(str(i) for i in id_list)})')
        if not alloc_list:
            raise ValueError('No allocations found')
        if not all([alloc.txn_id == alloc_list[0].txn_id for alloc in alloc_list]):
            raise ValueError('Allocations found from different transactions')
        if len(alloc_list) == 1:
            return alloc_list[0]

        alloc_list[0].amount = sum([alloc.amount for alloc in alloc_list])
        self.db.execute('UPDATE allocation SET amount = ? WHERE id = ?', (alloc_list[0].amount, alloc_list[0].id))
        self.db.execute(f'DELETE FROM allocation WHERE id IN ({",".join(str(i) for i in id_list[1:])})')
        return alloc_list[0]
