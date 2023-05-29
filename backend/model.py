#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# mode.py: This file contains the data models for the API
#

# System imports
from typing import Optional
from pydantic import BaseModel
from fastapi.param_functions import Form


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
    refresh_token: str
    token_type: str


class OAuth2RequestForm:
    '''
    This is a dependency class to use with FastAPI for token authorization. Use
    this insead of OAuth2PasswordRequestForm as the latter doesn't handle
    refresh tokens.
    '''

    def __init__(
        self,
        grant_type: str = Form(regex="password|refresh_token"),
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
