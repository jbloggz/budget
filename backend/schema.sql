/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * schema.sql: This file is the schema for the budget database
 */

/* A table to store the app settings */
CREATE TABLE IF NOT EXISTS setting (
   key             TEXT     PRIMARY KEY,  /* The key of the setting */
   value           TEXT     NOT NULL      /* The value of the setting */
);
CREATE INDEX IF NOT exists setting_key ON setting(key);

/* A table to store in-use refresh tokens */
CREATE TABLE IF NOT EXISTS token (
   value           TEXT     PRIMARY KEY,  /* The refresh token value */
   expire          INTEGER  NOT NULL,     /* The time to remove this entry */
   access_token    TEXT     DEFAULT NULL, /* The access token that was created */
   refresh_token   TEXT     DEFAULT NULL, /* The refresh token that was created */
   token_type      TEXT     DEFAULT NULL /* The type of token created */
);

/* A table to store the raw transactions scaped from the accounts */
CREATE TABLE IF NOT EXISTS txn (
   id              INTEGER  PRIMARY KEY,  /* A unique identifier for this table */
   date            TEXT     NOT NULL,     /* The date of the transaction in YYYY-MM-DD */
   amount          INTEGER  NOT NULL,     /* The amount of the transaction in cents */
   description     TEXT     NOT NULL,     /* The description scraped from the transaction history */
   source          TEXT     NOT NULL,     /* The source of the transaction (ie. which account) */
   balance         INTEGER  NOT NULL      /* The balance of the source after the transaction */
);
CREATE INDEX IF NOT exists txn_date_idx ON txn(date);
CREATE INDEX IF NOT EXISTS txn_description_idx ON txn(description);

/* A table to store the categories */
CREATE TABLE IF NOT EXISTS category (
   id              INTEGER  PRIMARY KEY,     /* A unique identifier for this table */
   name            TEXT     NOT NULL UNIQUE  /* The category name */
);
INSERT OR IGNORE INTO category VALUES (1, 'Unknown');

/* A table to store the locations */
CREATE TABLE IF NOT EXISTS location (
   id              INTEGER  PRIMARY KEY,     /* A unique identifier for this table */
   name            TEXT     NOT NULL UNIQUE  /* The location name */
);
INSERT OR IGNORE INTO location VALUES (1, 'Unknown');

/* A table to store the assignments of transactions to categories */
CREATE TABLE IF NOT EXISTS allocation (
   id              INTEGER  PRIMARY KEY,  /* A unique identifier for this table */
   amount          INTEGER  NOT NULL,     /* The amount of the transaction in cents */
   txn_id          INTEGER  NOT NULL REFERENCES txn(id) ON DELETE CASCADE ON UPDATE CASCADE,
   category_id     INTEGER  NOT NULL REFERENCES category(id) ON DELETE CASCADE ON UPDATE CASCADE,
   location_id     INTEGER  NOT NULL REFERENCES location(id) ON DELETE CASCADE ON UPDATE CASCADE,
   note            TEXT     DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS allocation_txn_idx ON allocation(txn_id);
CREATE INDEX IF NOT EXISTS allocation_category_idx ON allocation(category_id);
CREATE INDEX IF NOT EXISTS allocation_location_idx ON allocation(location_id);

/* Make sure foreign key constraints are enabled */
PRAGMA foreign_keys = ON;
