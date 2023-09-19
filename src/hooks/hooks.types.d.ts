/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * hooks.types.d.ts: This file contains the type definitions for the hooks
 */

export interface apiCredentialsType {
   access_token: string;
   refresh_token: string;
   token_type: 'bearer';
}

export interface apiRequestType<T> {
   method: 'GET' | 'POST' | 'PUT' | 'DELETE';
   url: string;
   headers?: { [key: string]: string };
   body?: URLSearchParams | string;
   validate?: (data) => data is T;
}

export type apiResponseType<T> = {
   code: number;
   data: T;
}

export interface apiTokenType {
   sub: string;
   exp: number;
   iat: number;
}
