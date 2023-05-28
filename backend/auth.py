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
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

# Local imports
from model import Token


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
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


def create_token(user: str) -> Token:
    '''
    Create a JSON web token

    Args:
        user: The user name
        expires_delta: The TTL

    Returns:
        The encoded token
    '''
    expire = datetime.utcnow() + timedelta(seconds=secrets['ttl'])
    return Token(
        access_token=jwt.encode({'sub': user, 'exp': expire}, secrets['key'], algorithm=secrets['algorithm']),
        token_type='bearer'
    )


def validate_token(token: Annotated[str, Depends(oauth2_scheme)]) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, secrets['key'], algorithms=secrets['algorithm'])
        username: str = payload.get('sub')
        if username not in secrets['users']:
            raise credentials_exception
        return username
    except:
        raise credentials_exception
