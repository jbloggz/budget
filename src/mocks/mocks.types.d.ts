/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * mocks.types.d.ts: This file contains the type definitions for the mocks
 */

export interface mockFetchRequest {
   url: string;
   method: string;
   headers: { [key: string]: string };
   body: object;
}

export interface mockFetchResponse {
   body: object;
   status: number;
   headers: { [key: string]: string };
}

export interface mockFetchType {
   actual: typeof fetch | undefined;
   mock: typeof fetch;
   enabled: boolean;
   setResponse: (body: object, status?: number, headers?: { [key: string]: string }) => void;
   setFailure: (msg: string) => void;
   calls: { request: mockFetchRequest; response: mockFetchResponse }[];
   reset: () => void;
   enable: () => void;
   disable: () => void;
}
