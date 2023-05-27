#
# MIT License
#
# Copyright (c) 2023 Josef Barnes
#
# auth.py: This file contains authentication code for the budget App
#

# System imports
import json
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

# Local imports
from model import Token


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    '''
    Verify a password from a user

    Args:
        plain_password:  The plain text password
        hashed_password: The hashed password from the database

    Returns:
        True if the password is valid, False if not
    '''
    return pwd_context.verify(plain_password, hashed_password)


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
    with open('secrets.json') as fp:
        secrets = json.load(fp)

    expire = datetime.utcnow() + timedelta(seconds=secrets['ttl'])
    return Token(
        access_token=jwt.encode({'user': user, 'exp': expire}, secrets['key'], algorithm=secrets['algorithm']),
        token_type='bearer'
    )
