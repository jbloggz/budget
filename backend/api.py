#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# api.py: This file implements a RESTFul API for the budget App
#

# System imports
from typing import List
from fastapi import FastAPI

# Local imports
from database import Database
from model import Transaction, Allocation


app = FastAPI()


@app.post("/transaction/", status_code=201, response_model=Transaction)
def add_transaction(txn: Transaction) -> Transaction:
    with Database() as db:
        db.add_transaction(txn)
    return txn


@app.get('/transaction/', response_model=List[Transaction])
def get_transactions(query: str) -> List[Transaction]:
    with Database() as db:
        return db.get_transaction_list(query)


@app.get('/allocation/', response_model=List[Allocation])
def get_allocations(query: str) -> List[Allocation]:
    with Database() as db:
        return db.get_allocation_list(query)
