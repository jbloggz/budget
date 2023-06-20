/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * mocks.types.d.ts: This file contains the type definitions for the mocks
 */

export interface mockFetchRequestType {
   url: string;
   method: string;
   headers: { [key: string]: string };
   body: object | string;
}

export interface mockFetchResponseType {
   body: string;
   status: number;
   headers: { [key: string]: string };
   isError: boolean;
}
