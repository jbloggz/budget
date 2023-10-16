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


def verify_user(username: str, password: str) -> bool:
    '''
    Verify a user

    Args:
        username: The name of the user
        password: The password of the user

    Returns:
        True if the user is valid, False if not
    '''
    if username not in secrets['users']:
        return False
    return pwd_context.verify(password, secrets['users'][username])


def hash_password(password: str) -> str:
    '''
    Hash a password for storage in a database

    Args:
        password: The plain text password

    Returns:
        The hashed password
    '''
    return pwd_context.hash(password)


def create_token(user: str, cached_token: Optional[str] = None) -> Token:
    '''
    Create a JSON web token

    Args:
        user:         The user name
        cached_token: The cached token to update

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
        refresh_expire = timegm(utc_refresh_expire.utctimetuple())
        db.add_cached_token(CachedToken(value=token.refresh_token, expire=refresh_expire, token=None))
        if cached_token is not None and secrets.get('refresh_token_expire_delay') is not None:
            expire = timegm(utcnow.utctimetuple()) + secrets['refresh_token_expire_delay']
            db.update_cached_token(CachedToken(value=cached_token, expire=expire, token=token))

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


def get_cached_token(value: Annotated[str, Depends(oauth2_scheme)]) -> Optional[CachedToken]:
    with Database() as db:
        return db.get_cached_token(value)


def clear_cached_token(value: Annotated[str, Depends(oauth2_scheme)]) -> None:
    with Database() as db:
        db.clear_cached_token(value)
