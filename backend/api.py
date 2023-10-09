#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# api.py: This file implements a RESTFul API for the budget App
#

# System imports
import os
from typing import List, Annotated, Optional
from fastapi import FastAPI, Query, Depends, HTTPException, status, Response
from fastapi.staticfiles import StaticFiles

# Local imports
from database import Database
from model import Transaction, TransactionList, Allocation, AllocationList, Token, OAuth2RequestForm
from auth import create_token, verify_user, validate_access_token, validate_refresh_token


app = FastAPI(openapi_url=None, docs_url=None, redoc_url=None)
db = Database()


@app.post('/api/transaction/', status_code=201, response_model=Transaction, dependencies=[Depends(validate_access_token)])
def add_transaction(txn: Transaction) -> Transaction:
    with db:
        db.add_transaction(txn)
    return txn


@app.get('/api/transaction/', response_model=TransactionList, dependencies=[Depends(validate_access_token)])
def get_transactions(start: Optional[str],
                     end: Optional[str],
                     filter: Optional[str] = None,
                     sort_column: str = 'date',
                     sort_order: str = 'desc',
                     limit: Optional[int] = None,
                     offset: int = 0) -> TransactionList:
    with db:
        filter_list: List[str] = []
        params: List[str | int] = []

        if start is not None and end is not None:
            filter_list.append('date BETWEEN ? AND ?')
            params.append(start)
            params.append(end)
        if filter:
            filter_list.append('description REGEXP ?')
            params.append(filter)
        if not filter_list:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'No filters supplied',
            )

        query = ' AND '.join(filter_list)

        if sort_column not in ['date', 'description', 'amount']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Invalid sort column: {sort_column}',
            )
        if sort_order not in ['asc', 'desc']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Invalid sort order: {sort_order}',
            )
        query += f' ORDER BY {sort_column} {sort_order}'

        return db.get_transaction_list(query, tuple(params), limit, offset)


@app.get("/api/transaction/{txn_id}")
def get_transaction(txn_id: int) -> Optional[Transaction]:
    with db:
        txn_list = db.get_transaction_list(f'id = {txn_id}')
        return txn_list.transactions[0] if txn_list.transactions else None


@app.get('/api/allocation/', response_model=AllocationList, dependencies=[Depends(validate_access_token)])
def get_allocations(txn: Optional[int] = None,
                    start: Optional[str] = None,
                    end: Optional[str] = None,
                    filter: Optional[str] = None,
                    sort_column: str = 'category',
                    sort_order: str = 'asc',
                    limit: Optional[int] = None,
                    offset: int = 0) -> AllocationList:
    with db:
        filter_list: List[str] = []
        params: List[str | int] = []

        if txn is not None:
            filter_list.append('txn.id = ?')
            params.extend([txn])
        if start is not None and end is not None:
            filter_list.append('txn.date BETWEEN ? AND ?')
            params.extend([start, end])
        if filter:
            filter_list.append('(txn.description REGEXP ? OR category.name REGEXP ? OR location.name REGEXP ? OR allocation.note REGEXP ?)')
            params.extend([filter, filter, filter, filter])

        if not filter_list:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'No filters supplied',
            )

        query = ' AND '.join(filter_list)

        sort_map = {
            'date': 'txn.date',
            'amount': 'txn.amount',
            'description': 'txn.description',
            'source': 'txn.source',
            'category': 'category.name',
            'location': 'location.name',
            'note': 'allocation.note',
        }

        if sort_column not in sort_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Invalid sort column: {sort_column}',
            )
        if sort_order not in ['asc', 'desc']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f'Invalid sort order: {sort_order}',
            )
        query += f' ORDER BY {sort_map[sort_column]} {sort_order}'

        return db.get_allocation_list(query, tuple(params), limit, offset)


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


@app.get('/api/oauth2/token/', response_class=Response, dependencies=[Depends(validate_access_token)])
def check_auth():
    return Response(status_code=status.HTTP_204_NO_CONTENT)


if os.environ.get('DIST_PATH'):  # pragma: no cover
    app.mount('/', StaticFiles(directory=os.environ.get('DIST_PATH'), html=True))
