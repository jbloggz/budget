/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * hooks.types.d.ts: This file contains the type definitions for the hooks
 */

export interface apiTokenType {
   access_token: string;
   refresh_token: string;
   token_type: 'bearer';
}

export interface apiResponseType {
   data?: object;
   errmsg?: string;
   success: boolean;
}
