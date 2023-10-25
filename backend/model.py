#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# mode.py: This file contains the data models for the API
#

# System imports
from typing import Optional, List
from pydantic import BaseModel
from fastapi.param_functions import Form


class Transaction(BaseModel):
    id: int | None = None
    date: str
    amount: int
    description: str
    source: str
    balance: int = 0


class TransactionList(BaseModel):
    total: int
    transactions: List[Transaction]


class Allocation(BaseModel):
    id: int | None = None
    txn_id: int
    date: str
    amount: int
    description: str
    source: str
    category: str
    location: str
    note: str | None = None


class AllocationList(BaseModel):
    total: int
    allocations: List[Allocation]


class DashboardPanel(BaseModel):
    category: str
    amount: int
    limit: int
    diff: float


class Score(BaseModel):
    name: str
    score: float


class Categorisation(BaseModel):
    categories: List[Score]
    locations: List[Score]


class SplitAmount(BaseModel):
    amount: int


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class CachedToken(BaseModel):
    value: str
    expire: int


class OAuth2RequestForm:
    '''
    This is a dependency class to use with FastAPI for token authorization. Use
    this instead of OAuth2PasswordRequestForm as the latter doesn't handle
    refresh tokens.
    '''

    def __init__(
        self,
        grant_type: str = Form(regex='password|refresh_token'),
        username: str = Form(default=''),
        password: str = Form(default=''),
        refresh_token: str = Form(default=''),
        scope: str = Form(default=''),
        client_id: Optional[str] = Form(default=None),
        client_secret: Optional[str] = Form(default=None),
    ):
        self.grant_type = grant_type
        self.username = username
        self.password = password
        self.refresh_token = refresh_token
        self.scopes = scope.split()
        self.client_id = client_id
        self.client_secret = client_secret
