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

export interface mockFetchType {
   __internal: {
      actual: typeof fetch | undefined;
      mock: typeof fetch;
      responses: {
         fn: (req: mockFetchRequestType) => boolean;
         body: string;
         status: number;
         headers: { [key: string]: string };
         isError: boolean;
      }[];
   };
   enabled: boolean;
   setResponse: (body: string, status?: number, headers?: { [key: string]: string }, isError?: boolean) => void;
   setJSONResponse: (body: object, status?: number, headers?: { [key: string]: string }, isError?: boolean) => void;
   setFailure: (msg: string) => void;
   setResponseIf: (
      fn: (req: mockFetchRequestType) => boolean,
      body: string,
      status?: number,
      headers?: { [key: string]: string },
      isError?: boolean
   ) => void;
   setJSONResponseIf: (
      fn: (req: mockFetchRequestType) => boolean,
      body: object,
      status?: number,
      headers?: { [key: string]: string },
      isError?: boolean
   ) => void;
   setFailureIf: (fn: (req: mockFetchRequestType) => boolean, msg: string) => void;
   calls: { request: mockFetchRequestType; response: mockFetchResponseType }[];
   reset: () => void;
   enable: () => void;
   disable: () => void;
}
