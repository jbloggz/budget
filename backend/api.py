#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# api.py: This file implements a RESTFul API for the budget App
#

# System imports
import os
import difflib
import math
import datetime
from typing import List, Annotated, Optional, Dict
from fastapi import FastAPI, Depends, HTTPException, status, Response, Body, Query, Request
from fastapi.staticfiles import StaticFiles

# Local imports
from database import Database
from model import Transaction, TransactionList, Allocation, AllocationList, Token, OAuth2RequestForm, Categorisation, Score, DashboardPanel
from auth import config, create_token, verify_user, validate_access_token, get_cached_token, validate_refresh_token, clear_cached_token


app = FastAPI(openapi_url=None, docs_url=None, redoc_url=None)


@app.post('/api/transaction/', status_code=201, response_model=Transaction, dependencies=[Depends(validate_access_token)])
def add_transaction(txn: Transaction) -> Transaction:
    with Database() as db:
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
    with Database() as db:
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
        query += f' ORDER BY {sort_column} {sort_order}, id {sort_order}'

        return db.get_transaction_list(query, tuple(params), limit, offset)


@app.get('/api/transaction/{txn_id}', response_model=Optional[Transaction], dependencies=[Depends(validate_access_token)])
def get_transaction(txn_id: int) -> Optional[Transaction]:
    with Database() as db:
        txn_list = db.get_transaction_list(f'id = {txn_id}')
        return txn_list.transactions[0] if txn_list.transactions else None


@app.delete('/api/transaction/', dependencies=[Depends(validate_access_token)])
def delete_transactions(id: Annotated[List[int], Query()]) -> None:
    with Database() as db:
        db.delete_transactions(id)


@app.get('/api/categorise/', response_model=Categorisation, dependencies=[Depends(validate_access_token)])
def get_categorise(description: str) -> Categorisation:
    with Database() as db:
        all_categories = set([v for v in db.get_category_list() if v != 'Unknown'])
        all_locations = set([v for v in db.get_location_list() if v != 'Unknown'])
        descr_map = db.get_description_map()

    category_scores = {k: {'score': 0, 'ratio': 0.0} for k in all_categories}
    location_scores = {k: {'score': 0, 'ratio': 0.0} for k in all_locations}
    description = description.lower()
    for candidate_description, candidate_data in descr_map.items():
        ratio = difflib.SequenceMatcher(a=description, b=candidate_description).ratio()
        for category, count in candidate_data['categories'].items():
            if category == 'Unknown':
                continue
            current_score = ratio * ratio * math.sqrt(count)
            if ratio == 1:
                current_score *= 10
            category_scores[category]['score'] += current_score
            category_scores[category]['ratio'] = max(ratio, category_scores[category]['ratio'])

        for location, count in candidate_data['locations'].items():
            if location == 'Unknown':
                continue
            current_score = ratio * ratio * math.sqrt(count)
            if ratio == 1:
                current_score *= 10
            location_scores[location]['score'] += current_score
            location_scores[location]['ratio'] = max(ratio, location_scores[location]['ratio'])

    res = Categorisation(categories=[], locations=[])

    if category_scores:
        # Get the list of categories sorted by score, normalised to the best
        sorted_category_scores = sorted(category_scores.items(), key=lambda x: x[1]['score'], reverse=True)
        best_score = sorted_category_scores[0][1]
        for category, score in sorted_category_scores:
            value = 0 if best_score['score'] == 0 else score['score'] / best_score['score'] * best_score['ratio']
            res.categories.append(Score(name=category, score=value))
            all_categories.discard(category)
        res.categories.extend(map(lambda x: Score(name=x, score=0.0), sorted(all_categories)))

    if location_scores:
        # Get the list of locations sorted by score, normalised to the best
        sorted_location_scores = sorted(location_scores.items(), key=lambda x: x[1]['score'], reverse=True)
        best_score = sorted_location_scores[0][1]
        for location, score in sorted_location_scores:
            value = 0 if best_score['score'] == 0 else score['score'] / best_score['score'] * best_score['ratio']
            res.locations.append(Score(name=location, score=value))
            all_locations.discard(location)
        res.locations.extend(map(lambda x: Score(name=x, score=0.0), sorted(all_locations)))

    return res


@app.get('/api/allocation/', response_model=AllocationList, dependencies=[Depends(validate_access_token)])
def get_allocations(txn: Optional[int] = None,
                    start: Optional[str] = None,
                    end: Optional[str] = None,
                    filter: Optional[str] = None,
                    sort_column: str = 'category',
                    sort_order: str = 'asc',
                    limit: Optional[int] = None,
                    offset: int = 0) -> AllocationList:
    with Database() as db:
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


@app.get('/api/allocation/{alloc_id}', response_model=None, dependencies=[Depends(validate_access_token)])
def get_allocation(alloc_id: int) -> Allocation | Response:
    with Database() as db:
        if alloc_id == 0:
            alloc_list = db.get_allocation_list(f'category.name = \'Unknown\' OR location.name = \'Unknown\' ORDER BY txn.date ASC')
            if not alloc_list.allocations:
                return Response(status_code=status.HTTP_204_NO_CONTENT)
        else:
            alloc_list = db.get_allocation_list(f'allocation.id = {alloc_id}')
            if not alloc_list.allocations:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        return alloc_list.allocations[0]


@app.get('/api/dashboard/', response_model=List[DashboardPanel], dependencies=[Depends(validate_access_token)])
def get_dashboard(start: str, end: str) -> List[DashboardPanel]:
    resp: List[DashboardPanel] = []
    with Database() as db:
        for panel_cfg in config['dashboard']:
            dt_start = datetime.datetime.strptime(start, '%Y-%m-%d').date()
            dt_end = datetime.datetime.strptime(end, '%Y-%m-%d').date()
            today = datetime.date.today()
            total_ndays = (dt_end - dt_start).days + 1
            if today < dt_end:
                if today < dt_start:
                    ndays = 0
                else:
                    ndays = (today - dt_start).days + 1
            else:
                ndays = total_ndays

            alloc_list = db.get_allocation_list(f'txn.date BETWEEN ? AND ? AND category.name = ?', (start, end, panel_cfg['category'])).allocations
            amount = -sum([alloc.amount for alloc in alloc_list])
            expected_amount = ndays / total_ndays * panel_cfg['limit']
            diff = (amount - expected_amount) / expected_amount * 100
            panel = DashboardPanel(category=panel_cfg['category'], amount=amount, limit=panel_cfg['limit'], diff=diff)
            resp.append(panel)

    return resp


@app.put('/api/allocation/', dependencies=[Depends(validate_access_token)])
def update_allocation(alloc: Allocation) -> None:
    with Database() as db:
        db.update_allocation(alloc)


@app.put('/api/allocation/{alloc_id}/split/', dependencies=[Depends(validate_access_token)])
def split_allocation(alloc_id: int, amount: Annotated[int, Body(embed=True)]) -> Allocation:
    with Database() as db:
        return db.split_allocation(alloc_id, amount)


@app.put('/api/allocation/{alloc_id}/merge/', dependencies=[Depends(validate_access_token)])
def merge_allocation(alloc_id: int, ids: Annotated[List[int], Body()]) -> Allocation:
    with Database() as db:
        return db.merge_allocations([alloc_id, *ids])


@app.post('/api/oauth2/token/', response_model=Token)
def auth(form_data: Annotated[OAuth2RequestForm, Depends()]) -> Token:
    if form_data.grant_type == 'refresh_token':
        token = get_cached_token(form_data.refresh_token)
        return create_token(validate_refresh_token(token.value), token.value)
    else:
        verify_user(form_data.username, form_data.password)
        return create_token(form_data.username)


@app.get('/api/oauth2/token/', response_class=Response, dependencies=[Depends(validate_access_token)])
def check_auth() -> Response:
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post('/api/oauth2/logout/', response_class=Response)
def logout(form_data: Annotated[OAuth2RequestForm, Depends()]) -> Response:
    clear_cached_token(form_data.refresh_token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


if os.environ.get('DIST_PATH'):  # pragma: no cover
    app.mount('/', StaticFiles(directory=os.environ.get('DIST_PATH'), html=True))
