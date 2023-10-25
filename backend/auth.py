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
from typing import Annotated
from fastapi import Depends, HTTPException, status, Request
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
with open(os.environ.get('CONFIG_PATH', 'budget.json')) as fp:
    config = json.load(fp)


def verify_user(username: str, password: str) -> None:
    '''
    Verify a user. Will raise an error if the user is not valid

    Args:
        username: The name of the user
        password: The password of the user
    '''
    if username not in config['users'] or not pwd_context.verify(password, config['users'][username]["hash"]):
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
    utc_access_expire = utcnow + timedelta(seconds=config['access_token_ttl'])
    utc_refresh_expire = utcnow + timedelta(seconds=config['refresh_token_ttl'])
    claims = {
        'sub': user,
        'iat': utcnow,
        'api': config['users'].get(user, {'api': ''})['api'],
    }
    token = Token(
        access_token=jwt.encode(claims | {'exp': utc_access_expire}, config['access_token_key'], algorithm=config['algorithm']),
        refresh_token=jwt.encode(claims | {'exp': utc_refresh_expire}, config['refresh_token_key'], algorithm=config['algorithm']),
        token_type='bearer'
    )

    with Database() as db:
        db.add_cached_token(CachedToken(value=token.refresh_token, expire=timegm(utc_refresh_expire.utctimetuple())))
        if refresh_token is not None:
            db.clear_cached_token(refresh_token)

    return token


def validate_token(key: str, token: Annotated[str, Depends(oauth2_scheme)]) -> str:
    try:
        payload = jwt.decode(token, config[key], algorithms=config['algorithm'])
        username: str = payload.get('sub')
        if username not in config['users']:
            raise ValueError('Invalid username')
        return username
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid/expired access token',
            headers={'WWW-Authenticate': 'Bearer'},
        )


def validate_access_token(token: Annotated[str, Depends(oauth2_scheme)], request: Request) -> str:
    username = validate_token('access_token_key', token)
    if request.method.upper() in ['PUT', 'POST', 'DELETE', 'PATCH']:
        # read/write access is required
        if config['users'][username]['api'] != 'rw':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Permission denied',
            )
    else:
        # read only access is required
        if config['users'][username]['api'] not in ['r', 'rw']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='Permission denied',
            )

    return username


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
