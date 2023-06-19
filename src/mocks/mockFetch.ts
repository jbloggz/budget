/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * mockFetch.ts: This file contains the mock for the global fetch function
 */

import { vi } from 'vitest';
import { mockFetchRequest, mockFetchResponse, mockFetchType } from '.';
import { getReasonPhrase } from 'http-status-codes';

export const mockFetch: mockFetchType = {
   actual: globalThis.fetch,
   mock: vi.fn(),
   enabled: false,
   setResponse: (body, status, headers) => {
      vi.mocked(mockFetch.mock).mockImplementation((url, params) => {
         if (!headers) {
            headers = {};
         }
         if (!('Content-Type' in headers)) {
            headers['Content-Type'] = 'application/json';
         }
         const mockReq: mockFetchRequest = {
            url: String(url),
            method: params?.method || 'GET',
            headers: (params?.headers as { [key: string]: string }) || {},
            body: JSON.parse(params?.body?.toString() || 'null'),
         };
         const mockResp: mockFetchResponse = {
            body,
            status: status || 200,
            headers,
         };

         mockFetch.calls.push({ request: mockReq, response: mockResp });
         return Promise.resolve({
            status: mockResp.status,
            ok: true,
            statusText: getReasonPhrase(mockResp.status),
            headers: new Headers(mockResp.headers),
            type: 'basic',
            url,
            json: () => Promise.resolve(body),
            text: () => Promise.resolve(JSON.stringify(body)),
         } as Response);
      });
   },
   setFailure: (msg) => {
      vi.mocked(mockFetch.mock).mockImplementation(() => Promise.reject(new TypeError(msg)));
   },
   calls: [],
   reset: () => {
      mockFetch.calls = [];
      mockFetch.setFailure('No response implemented');
   },
   enable: () => {
      if (!mockFetch.enabled) {
         mockFetch.enabled = true;
         globalThis.fetch = mockFetch.mock;
      }
   },
   disable: () => {
      if (mockFetch.enabled) {
         mockFetch.enabled = false;
         globalThis.fetch = mockFetch.actual as typeof fetch;
      }
   },
};
