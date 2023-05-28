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
from auth import create_token, verify_user, validate_token


app = FastAPI()
db = Database()


@app.post("/transaction/", status_code=201, response_model=Transaction, dependencies=[Depends(validate_token)])
def add_transaction(user: Annotated[str, Depends(validate_token)], txn: Transaction) -> Transaction:
    with db:
        db.add_transaction(txn)
    return txn


@app.get('/transaction/', response_model=List[Transaction], dependencies=[Depends(validate_token)])
def get_transactions(query: str) -> List[Transaction]:
    with db:
        return db.get_transaction_list(query)


@app.get('/allocation/', response_model=List[Allocation], dependencies=[Depends(validate_token)])
def get_allocations(query: str) -> List[Allocation]:
    with db:
        return db.get_allocation_list(query)


@app.put('/allocation/', dependencies=[Depends(validate_token)])
def update_allocation(alloc: Allocation) -> None:
    with db:
        db.update_allocation(alloc)


@app.get('/allocation/split/', dependencies=[Depends(validate_token)])
def split_allocation(id: int, amount: int) -> Allocation:
    with db:
        return db.split_allocation(id, amount)


@app.get('/allocation/merge/', dependencies=[Depends(validate_token)])
def merge_allocation(ids: Annotated[List[int], Query()]) -> Allocation:
    with db:
        return db.merge_allocations(ids)


@app.post('/login/', response_model=Token)
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    with db:
        if not verify_user(form_data.username, form_data.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return create_token(form_data.username)
