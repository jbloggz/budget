#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# database.py: This file implements a wrapper around a SQLite database
#

import os
import sqlite3


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
    DB_PATH = os.environ.get('DB_PATH') or './budget.db'

    def __init__(self):
        self.con = sqlite3.connect(Database.DB_PATH)
        self.db = self.con.cursor()
        with open('schema.sql') as fp:
            schema = fp.read()
            self.db.executescript(schema)

    def get_tables(self):
        '''
        Get a list of all the sql tables in the database
        '''
        self.db.execute('SELECT name FROM sqlite_master WHERE type=\'table\'')
        return [v[0] for v in self.db.fetchall()]

    def get_fields(self, table):
        '''
        Get a list of all the fields for a given table
        '''
        self.db.execute('select name from pragma_table_info(?)', (table, ))
        return [v[0] for v in self.db.fetchall()]
