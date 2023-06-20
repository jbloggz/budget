/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * mockFetch.ts: This file contains the mock for the global fetch function
 */

import { vi } from 'vitest';
import { mockFetchRequestType, mockFetchResponseType, mockFetchType } from '.';
import { getReasonPhrase } from 'http-status-codes';

export const mockFetch: mockFetchType = {
   __internal: {
      actual: globalThis.fetch,
      mock: vi.fn(),
      responses: [],
   },
   enabled: false,
   setResponseIf: (fn, body, status, headers, isError) => {
      mockFetch.__internal.responses.unshift({ fn, body, status: status || 200, headers: headers || {}, isError: !!isError });
   },
   setJSONResponseIf: (fn, body, status, headers, isError) => {
      if (!headers) {
         headers = {};
      }
      if (!isError && !('Content-Type' in headers)) {
         headers['Content-Type'] = 'application/json';
      }
      mockFetch.setResponseIf(fn, JSON.stringify(body), status, headers, isError);
   },
   setFailureIf: (fn, msg) => mockFetch.setResponseIf(fn, msg, -1, {}, true),
   setResponse: (body, status, headers, isError) => mockFetch.setResponseIf(() => true, body, status, headers, isError),
   setJSONResponse: (body, status, headers, isError) => mockFetch.setJSONResponseIf(() => true, body, status, headers, isError),
   setFailure: (msg) => mockFetch.setFailureIf(() => true, msg),
   calls: [],
   reset: () => {
      mockFetch.calls = [];
      mockFetch.__internal.responses = [];
   },
   enable: () => {
      if (!mockFetch.enabled) {
         mockFetch.enabled = true;
         globalThis.fetch = mockFetch.__internal.mock;
         vi.mocked(mockFetch.__internal.mock).mockImplementation((url, params) => {
            const mockReq: mockFetchRequestType = {
               url: String(url),
               method: params?.method || 'GET',
               headers: (params?.headers as { [key: string]: string }) || {},
               body: JSON.parse(params?.body?.toString() || 'null'),
            };
            for (const resp of mockFetch.__internal.responses) {
               if (!resp.fn(mockReq)) {
                  continue;
               }

               const mockResp: mockFetchResponseType = {
                  body: resp.body,
                  status: resp.status,
                  headers: resp.headers,
                  isError: resp.isError,
               };

               mockFetch.calls.push({ request: mockReq, response: mockResp });
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

            const mockResp: mockFetchResponseType = {
               body: 'No response implemented',
               status: -1,
               headers: {},
               isError: true,
            };
            mockFetch.calls.push({ request: mockReq, response: mockResp });
            return Promise.reject(new TypeError('No response implemented'));
         });
      }
   },
   disable: () => {
      if (mockFetch.enabled) {
         mockFetch.enabled = false;
         globalThis.fetch = mockFetch.__internal.actual as typeof fetch;
      }
   },
};
