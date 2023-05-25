#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# api.py: This file implements a RESTFul API for the budget App
#

from typing import List
from fastapi import FastAPI
from pydantic import BaseModel
from database import Database


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


app = FastAPI()


@app.post("/transaction/", status_code=201, response_model=Transaction)
def add_transaction(txn: Transaction) -> Transaction:
    with Database() as db:
        txn.id = db.add_transaction(txn.time, txn.amount, txn.description, txn.source)
    return txn


@app.get('/transaction/', response_model=List[Transaction])
def get_transactions(query: str) -> List[Transaction]:
    with Database() as db:
        txn_list = db.get_transaction_list(query)
    return [Transaction(id=t['id'], time=t['time'], amount=t['amount'], description=t['description'], source=t['source']) for t in txn_list]


@app.get('/allocation/', response_model=List[Allocation])
def get_allocations(query: str) -> List[Allocation]:
    with Database() as db:
        txn_list = db.get_allocation_list(query)
    return [Allocation(id=t['id'], txn_id=t['txn_id'], time=t['time'], amount=t['amount'], category=t['category'], location=t['location']) for t in txn_list]
