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

# Local imports
from database import Database
from model import Transaction, Allocation, Token, OAuth2RequestForm
from auth import create_token, verify_user, validate_access_token, validate_refresh_token


app = FastAPI(openapi_url=None, docs_url=None, redoc_url=None)
db = Database()


@app.post('/api/transaction/', status_code=201, response_model=Transaction, dependencies=[Depends(validate_access_token)])
def add_transaction(txn: Transaction) -> Transaction:
    with db:
        db.add_transaction(txn)
    return txn


@app.get('/api/transaction/', response_model=List[Transaction], dependencies=[Depends(validate_access_token)])
def get_transactions(query: str) -> List[Transaction]:
    with db:
        return db.get_transaction_list(query)


@app.get('/api/allocation/', response_model=List[Allocation], dependencies=[Depends(validate_access_token)])
def get_allocations(query: str) -> List[Allocation]:
    with db:
        return db.get_allocation_list(query)


@app.put('/api/allocation/', dependencies=[Depends(validate_access_token)])
def update_allocation(alloc: Allocation) -> None:
    with db:
        db.update_allocation(alloc)


@app.get('/api/allocation/split/', dependencies=[Depends(validate_access_token)])
def split_allocation(id: int, amount: int) -> Allocation:
    with db:
        return db.split_allocation(id, amount)


@app.get('/api/allocation/merge/', dependencies=[Depends(validate_access_token)])
def merge_allocation(ids: Annotated[List[int], Query()]) -> Allocation:
    with db:
        return db.merge_allocations(ids)


@app.post('/api/oauth2/token/', response_model=Token)
def auth(form_data: Annotated[OAuth2RequestForm, Depends()]) -> Token:
    if form_data.grant_type == 'refresh_token':
        username = validate_refresh_token(form_data.refresh_token)
        return create_token(username)
    else:
        if not verify_user(form_data.username, form_data.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Incorrect username or password',
                headers={'WWW-Authenticate': 'Bearer'},
            )
        return create_token(form_data.username)
