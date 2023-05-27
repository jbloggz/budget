#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# api.py: This file implements a RESTFul API for the budget App
#

# System imports
from typing import List, Annotated
from fastapi import FastAPI, Query, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

# Local imports
from database import Database
from model import Transaction, Allocation, Token
from auth import verify_password, create_token


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


@app.put('/allocation/')
def update_allocation(alloc: Allocation) -> None:
    with Database() as db:
        db.update_allocation(alloc)


@app.get('/allocation/split/')
def split_allocation(id: int, amount: int) -> Allocation:
    with Database() as db:
        return db.split_allocation(id, amount)


@app.get('/allocation/merge/')
def merge_allocation(ids: Annotated[List[int], Query()]) -> Allocation:
    with Database() as db:
        return db.merge_allocations(ids)


@app.post('/login/', response_model=Token)
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    with Database() as db:
        user = db.get_user(form_data.username)
        if not user or not verify_password(form_data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return create_token(form_data.username)
