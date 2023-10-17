#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# auth.py: This file contains authentication code for the budget App
#

# System imports
import os
import json
import time
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from calendar import timegm
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from typing import Optional

# Local imports
from model import Token, CachedToken
from database import Database


pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='oauth2/token')
with open(os.environ.get('SECRETS_PATH', 'secrets.json')) as fp:
    secrets = json.load(fp)


def verify_user(username: str, password: str) -> None:
    '''
    Verify a user. Will raise an error if the user is not valid

    Args:
        username: The name of the user
        password: The password of the user
    '''
    if username not in secrets['users'] or not pwd_context.verify(password, secrets['users'][username]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Incorrect username or password',
            headers={'WWW-Authenticate': 'Bearer'},
        )


def hash_password(password: str) -> str:
    '''
    Hash a password for storage in a database

    Args:
        password: The plain text password

    Returns:
        The hashed password
    '''
    return pwd_context.hash(password)


def create_token(user: str, refresh_token: Optional[str] = None) -> Token:
    '''
    Create a JSON web token

    Args:
        user:          The user name
        refresh_token: The refresh_token if applicable

    Returns:
        The encoded token
    '''
    utcnow = datetime.utcnow()
    utc_access_expire = utcnow + timedelta(seconds=secrets['access_token_ttl'])
    utc_refresh_expire = utcnow + timedelta(seconds=secrets['refresh_token_ttl'])
    token = Token(
        access_token=jwt.encode({'sub': user, 'exp': utc_access_expire, 'iat': utcnow}, secrets['access_token_key'], algorithm=secrets['algorithm']),
        refresh_token=jwt.encode({'sub': user, 'exp': utc_refresh_expire, 'iat': utcnow}, secrets['refresh_token_key'], algorithm=secrets['algorithm']),
        token_type='bearer'
    )

    with Database() as db:
        db.add_cached_token(CachedToken(value=token.refresh_token, expire=timegm(utc_refresh_expire.utctimetuple())))
        if refresh_token is not None:
            db.clear_cached_token(refresh_token)

    return token


def validate_token(key: str, token: Annotated[str, Depends(oauth2_scheme)]) -> str:
    try:
        payload = jwt.decode(token, secrets[key], algorithms=secrets['algorithm'])
        username: str = payload.get('sub')
        if username not in secrets['users']:
            raise ValueError('Invalid username')
        return username
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid/expired access token',
            headers={'WWW-Authenticate': 'Bearer'},
        )


def validate_access_token(token: Annotated[str, Depends(oauth2_scheme)]) -> str:
    return validate_token('access_token_key', token)


def validate_refresh_token(token: Annotated[str, Depends(oauth2_scheme)]) -> str:
    return validate_token('refresh_token_key', token)


def get_cached_token(value: Annotated[str, Depends(oauth2_scheme)]) -> CachedToken:
    with Database() as db:
        token = db.get_cached_token(value)
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Incorrect token',
                headers={'WWW-Authenticate': 'Bearer'},
            )
        return token


def clear_cached_token(value: Annotated[str, Depends(oauth2_scheme)]) -> None:
    with Database() as db:
        db.clear_cached_token(value)
