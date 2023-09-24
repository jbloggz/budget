/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * mockFetch.ts: This file contains the mock for the global fetch function
 */

import { vi } from 'vitest';
import { getReasonPhrase } from 'http-status-codes';

export interface MockFetchRequest {
   url: string;
   method: string;
   headers: { [key: string]: string };
   body: string | null;
}

export interface MockFetchResponse {
   body: string;
   status: number;
   headers: { [key: string]: string };
   isError: boolean;
}

class MockFetch {
   /* Private variables */
   #actual = globalThis.fetch;
   #mock = vi.fn();
   #responses: {
      fn: (req: MockFetchRequest) => boolean;
      body: string;
      status: number;
      headers: { [key: string]: string };
      isError: boolean;
   }[] = [];
   #enabled = false;
   #calls: { request: MockFetchRequest; response: MockFetchResponse }[] = [];

   setResponseIf(fn: (req: MockFetchRequest) => boolean, body: string, status?: number, headers?: { [key: string]: string }, isError?: boolean) {
      this.#responses.unshift({ fn, body, status: status || 200, headers: headers || {}, isError: !!isError });
   }

   setJSONResponseIf(fn: (req: MockFetchRequest) => boolean, body: object, status?: number, headers?: { [key: string]: string }, isError?: boolean) {
      if (!headers) {
         headers = {};
      }
      if (!isError && !('Content-Type' in headers)) {
         headers['Content-Type'] = 'application/json';
      }
      this.setResponseIf(fn, JSON.stringify(body), status, headers, isError);
   }

   setFailureIf(fn: (req: MockFetchRequest) => boolean, msg: string) {
      this.setResponseIf(fn, msg, -1, {}, true);
   }

   setResponse(body: string, status?: number, headers?: { [key: string]: string }, isError?: boolean) {
      this.setResponseIf(() => true, body, status, headers, isError);
   }

   setJSONResponse(body: object, status?: number, headers?: { [key: string]: string }, isError?: boolean) {
      this.setJSONResponseIf(() => true, body, status, headers, isError);
   }

   setFailure(msg: string) {
      this.setFailureIf(() => true, msg);
   }

   reset() {
      this.#calls = [];
      this.#responses = [];
      this.disable();
      this.enable();
   }

   isEnabled() {
      return this.#enabled;
   }

   calls() {
      return this.#calls;
   }

   enable() {
      if (!this.#enabled) {
         this.#enabled = true;
         globalThis.fetch = this.#mock;
         vi.mocked(this.#mock).mockImplementation((url, params) => {
            const mockReq: MockFetchRequest = structuredClone({
               url: String(url),
               method: params?.method || 'GET',
               headers: (params?.headers as { [key: string]: string }) || {},
               body: params?.body?.toString() || null,
            });
            for (const resp of this.#responses) {
               if (!resp.fn(mockReq)) {
                  continue;
               }

               const mockResp: MockFetchResponse = structuredClone({
                  body: resp.body,
                  status: resp.status,
                  headers: resp.headers,
                  isError: resp.isError,
               });

               this.#calls.push({ request: mockReq, response: mockResp });
               return mockResp.isError
                  ? Promise.reject(new TypeError(mockResp.body))
                  : Promise.resolve({
                       status: mockResp.status,
                       ok: true,
                       statusText: getReasonPhrase(mockResp.status),
                       headers: new Headers(mockResp.headers),
                       type: 'basic',
                       url,
                       json: () => Promise.resolve(JSON.parse(mockResp.body)),
                       text: () => Promise.resolve(mockResp.body),
                    } as Response);
            }

            const mockResp: MockFetchResponse = {
               body: 'No response implemented',
               status: -1,
               headers: {},
               isError: true,
            };
            this.#calls.push({ request: mockReq, response: mockResp });
            return Promise.reject(new TypeError('No response implemented'));
         });
      }
   }

   disable() {
      if (this.#enabled) {
         this.#enabled = false;
         globalThis.fetch = this.#actual as typeof fetch;
      }
   }
}

export const mockFetch = new MockFetch();
