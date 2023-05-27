#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# mode.py: This file contains the data models for the API
#

# System imports
from pydantic import BaseModel


class Transaction(BaseModel):
    id: int | None = None
    time: int
    amount: int
    description: str
    source: str


class Allocation(BaseModel):
    id: int | None = None
    txn_id: int
    time: int
    amount: int
    category: str
    location: str
    note: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str


class User(BaseModel):
    name: str
    password: str
