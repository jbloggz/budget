#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# database.py: This file implements a wrapper around a SQLite database
#

# System imports
import os
import re
import json
import sqlite3
from typing import List, Optional, Tuple, Dict
import time

# Local imports
from model import Transaction, TransactionList, Allocation, AllocationList, CachedToken, PushSubscription


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
        self.con.create_function('REGEXP', 2, lambda x, y: 1 if re.search(x, y or '', re.IGNORECASE) else 0)
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

    def clear_expired_tokens(self) -> None:
        self.db.execute('DELETE FROM token WHERE expire <= ?', (int(time.time()),))

    def add_cached_token(self, token: CachedToken) -> None:
        self.clear_expired_tokens()
        self.db.execute('INSERT OR IGNORE INTO token VALUES (?, ?)', (token.value, token.expire))

    def get_cached_token(self, value: str) -> Optional[CachedToken]:
        self.clear_expired_tokens()
        self.db.execute('SELECT value, expire FROM token WHERE value = ?', (value,))
        row = self.db.fetchone()
        if not row:
            return None
        return CachedToken(value=row[0], expire=row[1])

    def clear_cached_token(self, value: str) -> None:
        '''
        Remove a cached token from the database

        Args:
            value: The token value
        '''
        self.clear_expired_tokens()
        self.db.execute('DELETE FROM token WHERE value = ?', (value,))

    def add_transaction(self, txn: Transaction) -> Transaction:
        '''
        Add a new transaction

        Args:
            txn:   The transaction to add

        Returns:
            The transaction with the ID filled in
        '''
        self.db.execute('INSERT INTO txn VALUES (NULL, ?, ?, ?, ?, 0, ?)', (txn.date, txn.amount, txn.description, txn.source, txn.pending))
        txn.id = self.db.lastrowid
        self.db.execute('INSERT INTO allocation VALUES (NULL, ?, ?, 1, 1, NULL)', (txn.amount, txn.id))
        return txn

    def update_transaction(self, txn_id: int, txn: Transaction) -> None:
        '''
        Updates an existing transaction

        Args:
            id:  The id to update
            txn: The new details
        '''
        self.db.execute('UPDATE txn set date = ?, amount = ?, description = ?, source = ?, balance = ?, pending = ? WHERE id = ?',
                        (txn.date, txn.amount, txn.description, txn.source, txn.balance, txn.pending, txn_id))

    def get_transaction_list(self, expr: Optional[str] = None, params: Tuple = tuple(), limit: Optional[int] = None, offset: int = 0) -> TransactionList:
        '''
        Get list of transaction based on a filter expression

        Args:
            expr:   An SQL expression
            params: Optional parameters to the expression
            limit:  The amount of rows to return
            offset: The amount of rows to skip

        Returns:
            A list of transactions that match the filter
        '''
        if expr:
            self.db.execute(f'SELECT id, date, amount, description, source, balance, pending FROM txn WHERE {expr}', params)
        else:
            self.db.execute(f'SELECT id, date, amount, description, source, balance, pending FROM txn')
        res = TransactionList(total=0, transactions=[])
        for row in self.db:
            res.total += 1
            if offset > 0:
                offset -= 1
                continue
            if limit is not None:
                if limit <= 0:
                    continue
                limit -= 1

            res.transactions.append(Transaction(
                id=row[0],
                date=row[1],
                amount=row[2],
                description=row[3],
                source=row[4],
                balance=row[5],
                pending=row[6] == 1,
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
        return txn_list.transactions[0] if txn_list.transactions else None

    def delete_transactions(self, ids: List[int]) -> None:
        '''
        Delete transactions from the database

        Args:
            ids: The list of transaction ID's to delete
        '''
        if ids:
            self.db.execute(f'DELETE FROM txn WHERE id in ({",".join(["?" for _ in ids])})', ids)

    def get_description_map(self) -> Dict:
        '''
        Get a map of descriptions to categories and locations

        Returns:
            A map of descriptions to the categories/locations that have need assigned
        '''
        query = '''SELECT LOWER(txn.description) as description,
                          category.name as category,
                          location.name as location
                   FROM allocation
                   LEFT JOIN category ON category_id = category.id
                   LEFT JOIN location ON location_id = location.id
                   LEFT JOIN txn ON txn_id = txn.id'''

        self.db.execute(query)
        res: Dict[str, Dict] = {}
        for row in self.db:
            description, category, location = row
            if description not in res:
                res[description] = {
                    'categories': {},
                    'locations': {}
                }
            if category not in res[description]['categories']:
                res[description]['categories'][category] = 0
            if location not in res[description]['locations']:
                res[description]['locations'][location] = 0

            res[description]['categories'][category] += 1
            res[description]['locations'][location] += 1

        return res

    def get_category_list(self) -> List[str]:
        '''
        Get a list of all categories

        Returns:
            The list of all category names
        '''
        self.db.execute('SELECT name FROM category')
        return [v[0] for v in self.db.fetchall()]

    def get_location_list(self) -> List[str]:
        '''
        Get a list of all locations

        Returns:
            The list of all location names
        '''
        self.db.execute('SELECT name FROM location')
        return [v[0] for v in self.db.fetchall()]

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

    def get_allocation_list(self, expr: Optional[str] = None, params: Tuple = tuple(), limit: Optional[int] = None, offset: int = 0) -> AllocationList:
        '''
        Get list of allocations based on a filter expression

        Args:
            expr:   An SQL expression
            params: Optional parameters to the expression
            limit:  The amount of rows to return
            offset: The amount of rows to skip

        Returns:
            A list of allocations that match the filter
        '''
        query = '''SELECT allocation.id as id,
                          allocation.txn_id as txn_id,
                          txn.date as date,
                          allocation.amount as amount,
                          txn.description as description,
                          txn.source as source,
                          category.name as category,
                          location.name as location,
                          txn.pending as pending,
                          allocation.note as note
                   FROM allocation
                   LEFT JOIN category ON category_id = category.id
                   LEFT JOIN location ON location_id = location.id
                   LEFT JOIN txn ON txn_id = txn.id'''
        if expr:
            query += f' WHERE {expr}'

        self.db.execute(query, params)

        res = AllocationList(total=0, allocations=[])
        for row in self.db:
            res.total += 1
            if offset > 0:
                offset -= 1
                continue
            if limit is not None:
                if limit <= 0:
                    continue
                limit -= 1

            res.allocations.append(Allocation(
                id=row[0],
                txn_id=row[1],
                date=row[2],
                amount=row[3],
                description=row[4],
                source=row[5],
                category=row[6],
                location=row[7],
                pending=row[8] == 1,
                note=row[9],
            ))

        return res

    def get_txn_allocations(self, txn_id: int) -> AllocationList:
        '''
        Get list of allocations for a transaction

        Args:
            txn_id: The id of a transaction

        Returns:
            A list of allocations
        '''
        return self.get_allocation_list('txn_id = ?', (txn_id,))

    def get_allocation(self, alloc_id: int) -> Optional[Allocation]:
        '''
        Get an existing allocation

        Args:
            alloc_id: The allocation ID

        Returns:
            The allocation, or None if alloc_id is invalid
        '''
        res = self.get_allocation_list('allocation.id = ?', (alloc_id,))
        return res.allocations[0] if res.allocations else None

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
            raise ValueError('Invalid allocation')
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
        Merge multiple allocations into a single allocation by adding all the amounts to the first

        Args:
            id_list: The list of allocation IDs

        Returns:
            The merged allocation
        '''
        alloc_list = self.get_allocation_list(f'allocation.id IN ({",".join(str(i) for i in id_list)})').allocations
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

    def overwrite_transaction(self, old_id: int, txn: Transaction) -> None:
        '''
        Overwrite dst transaction with the data from src transaction

        Args:
            old_id: The transaction id whose data will be overwritten
            src: The transaction whose data you want
        '''
        self.db.execute('UPDATE txn SET date = ?, amount = ?, description = ?, source = ?, balance = ?, pending = ? WHERE id = ?',
                        (txn.date, txn.amount, txn.description, txn.source, txn.balance, txn.pending, old_id))
        self.db.execute(f'DELETE FROM txn WHERE id = ?', (txn.id,))

    def add_push_subscription(self, sub: PushSubscription) -> PushSubscription:
        '''
        Add a push subscription

        Args:
            sub: The subscription to add
        '''
        self.db.execute('INSERT INTO push_subscription VALUES (NULL, ?)', (json.dumps(sub.value),))
        sub.id = self.db.lastrowid
        return sub

    def get_push_subscriptions(self) -> List[PushSubscription]:
        '''
        Get a list of all push subscriptions

        Returns:
            The list of all push subscriptions
        '''
        self.db.execute('SELECT id, value FROM push_subscription')
        return [PushSubscription(id=int(v[0]), value=json.loads(v[1])) for v in self.db.fetchall()]

    def delete_push_subscription(self, id: int) -> None:
        '''
        Delete a push subscription

        Args:
            id: The id to remove
        '''
        self.db.execute('DELETE FROM push_subscription WHERE id = ?', (id,))
