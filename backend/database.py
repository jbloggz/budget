#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# database.py: This file implements a wrapper around a SQLite database
#

import os
import sqlite3
from typing import List


class Singleton(object):
    '''
    This is a singleton class. Anything that inherits from it will be a singleton
    '''
    def __new__(cls, *args, **kw):
        if not hasattr(cls, '_instance'):
            org = super(Singleton, cls)
            cls._instance = org.__new__(cls, *args, **kw)
        return cls._instance


class Database(Singleton):
    '''
    A class that abstracts the interaction with the SQLite database
    '''
    DB_PATH = os.environ.get('DB_PATH') or './budget.db'

    def __init__(self):
        self.con = sqlite3.connect(Database.DB_PATH)
        self.db = self.con.cursor()
        with open('schema.sql') as fp:
            schema = fp.read()
            self.db.executescript(schema)

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
