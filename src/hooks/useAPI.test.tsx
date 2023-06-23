/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * AuthProvider.test.tsx: This file contains the tests for the AuthProvider
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useAPI } from '.';
import { useEffect, useState } from 'react';
import { mockFetch } from '../mocks';

describe('useAPI', () => {
   beforeEach(() => {
      vi.resetAllMocks();
      mockFetch.reset();
   });

   it('can call useAPI', () => {
      const TestComponenet = () => {
         const api = useAPI();
         return <div role="test">{api ? 'yes' : 'no'}</div>;
      };
      render(<TestComponenet />);
      const val = screen.getByRole('test');
      expect(val.textContent).toBe('yes');
   });

   it('can make a GET request with a valid token', async () => {
      mockFetch.setJSONResponse({ hello: 'world' });
      localStorage.setItem('access_token', '"GETToken"');
      const TestComponenet = () => {
         const { get } = useAPI();
         useEffect(() => {
            const run = async () => {
               const resp = await get('/foo/get/');
               expect(resp.success).toBe(true);
               expect(resp.status).toBe(200);
               expect(resp.data).toStrictEqual({ hello: 'world' });
            };
            run();
         }, [get]);
         return <></>;
      };
      render(<TestComponenet />);
      expect(mockFetch.calls().length).toEqual(1);
      const req = mockFetch.calls()[0].request;
      expect(req.url).toEqual('/foo/get/');
      expect(req.method).toEqual('GET');
      expect(req.body).toBeNull();
      expect(req.headers['Authorization']).toEqual('Bearer GETToken');
      expect(req.headers['Content-Type']).not.toBeDefined();
   });

   it('can make a POST request with a valid token', async () => {
      mockFetch.setJSONResponse({ hello: 'world' }, 201);
      localStorage.setItem('access_token', '"POSTToken"');
      const TestComponenet = () => {
         const { post } = useAPI();
         useEffect(() => {
            const run = async () => {
               const resp = await post('/foo/post/', { msg: 'hello' });
               expect(resp.success).toBe(true);
               expect(resp.status).toBe(201);
            };
            run();
         }, [post]);
         return <></>;
      };
      render(<TestComponenet />);
      expect(mockFetch.calls().length).toEqual(1);
      const req = mockFetch.calls()[0].request;
      const resp = mockFetch.calls()[0].response;
      expect(req.url).toEqual('/foo/post/');
      expect(req.method).toEqual('POST');
      expect(req.body).toBe('{"msg":"hello"}');
      expect(req.headers['Authorization']).toEqual('Bearer POSTToken');
      expect(req.headers['Content-Type']).toEqual('application/json');
      expect(resp.status).toBe(201);
   });

   it('can make a PUT request with a valid token', async () => {
      mockFetch.setJSONResponse({ hello: 'world' });
      localStorage.setItem('access_token', '"PUTToken"');
      const TestComponenet = () => {
         const { put } = useAPI();
         useEffect(() => {
            const run = async () => {
               const resp = await put('/foo/put/', { msg: 'hello' });
               expect(resp.success).toBe(true);
               expect(resp.status).toBe(200);
            };
            run();
         }, [put]);
         return <></>;
      };
      render(<TestComponenet />);
      expect(mockFetch.calls().length).toEqual(1);
      const req = mockFetch.calls()[0].request;
      expect(req.url).toEqual('/foo/put/');
      expect(req.method).toEqual('PUT');
      expect(req.body).toBe('{"msg":"hello"}');
      expect(req.headers['Authorization']).toBe('Bearer PUTToken');
      expect(req.headers['Content-Type']).toBe('application/json');
   });

   it('can clear a token', async () => {
      mockFetch.setResponse('', 401);
      mockFetch.setResponseIf((req) => req.headers.Authorization === 'Bearer good_access_token', '', 401);
      mockFetch.setJSONResponse({ hello: 'world' });
      localStorage.setItem('access_token', '"good_access_token"');
      const TestComponenet = () => {
         const { get, clearToken } = useAPI();
         useEffect(() => {
            const run = async () => {
               const resp = await get('/foo/put/');
               expect(resp.success).toBe(true);
               expect(resp.status).toBe(200);
               clearToken();
               await waitFor(() => expect(localStorage.getItem('access_token')).toBe(null));
               const resp2 = await get('/foo/put/');
               expect(resp2.success).toBe(false);
               expect(resp2.status).toBe(401);
            };
            run();
         }, [get, clearToken]);
         return <></>;
      };
      render(<TestComponenet />);
   });

   it('can make a successful login request and receive a token', async () => {
      mockFetch.setResponse('', 401);
      mockFetch.setJSONResponseIf(
         (req) => {
            const params = new URLSearchParams(req.body || '');
            return (
               params.get('username') === 'joe@foo.com' &&
               params.get('password') === 'foobar' &&
               params.get('grant_type') === 'password' &&
               req.headers['Content-Type'] === 'application/x-www-form-urlencoded'
            );
         },
         { access_token: 'dummy_access_token', refresh_token: 'dummy_refresh_token', token_type: 'bearer' }
      );
      const TestComponenet = () => {
         const { getToken } = useAPI();
         const [accessToken, setAccessToken] = useState<string | undefined>();
         const [refreshToken, setRefreshToken] = useState<string | undefined>();
         const [tokenType, setTokenType] = useState<string | undefined>();
         const [ready, setReady] = useState<string>('no');
         useEffect(() => {
            const run = async () => {
               const resp = await getToken('joe@foo.com', 'foobar');
               setAccessToken(resp.access_token);
               setRefreshToken(resp.refresh_token);
               setTokenType(resp.token_type);
               setReady('yes');
            };
            run();
         }, [getToken]);
         return (
            <>
               <div role="ready">{ready}</div>
               <div role="access">{accessToken}</div>
               <div role="refresh">{refreshToken}</div>
               <div role="type">{tokenType}</div>
            </>
         );
      };
      render(<TestComponenet />);
      expect(mockFetch.calls().length).toEqual(1);
      const req = mockFetch.calls()[0].request;
      expect(req.url).toEqual('/api/oauth2/token/');
      expect(req.method).toEqual('POST');
      expect(req.body).toBe('username=joe%40foo.com&password=foobar&grant_type=password');
      expect(req.headers['Authorization']).not.toBeDefined();
      expect(req.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      await waitFor(() => expect(screen.getByRole('ready').textContent).toBe('yes'));
      expect(screen.getByRole('access').textContent).toBe('dummy_access_token');
      expect(screen.getByRole('refresh').textContent).toBe('dummy_refresh_token');
      expect(screen.getByRole('type').textContent).toBe('bearer');
      expect(localStorage.getItem('access_token')).toBe('"dummy_access_token"');
      expect(localStorage.getItem('refresh_token')).toBe('"dummy_refresh_token"');
   });

   it('can check a valid access_token', async () => {
      mockFetch.setResponseIf((req) => req.headers.Authorization === 'Bearer CheckToken', '', 204);
      localStorage.setItem('access_token', '"CheckToken"');
      const TestComponenet = () => {
         const { get } = useAPI();
         useEffect(() => {
            const run = async () => {
               const resp = await get('/api/oauth2/token/');
               expect(resp.success).toBe(true);
               expect(resp.status).toBe(204);
            };
            run();
         }, [get]);
         return <></>;
      };
      render(<TestComponenet />);
      expect(mockFetch.calls().length).toEqual(1);
      const req = mockFetch.calls()[0].request;
      expect(req.url).toEqual('/api/oauth2/token/');
      expect(req.method).toEqual('GET');
      expect(req.body).toBe(null);
      expect(req.headers['Authorization']).toBe('Bearer CheckToken');
   });

   it('can refresh a token if a request is denied', async () => {
      const good_token = { access_token: 'new_access_token', refresh_token: 'new_refresh_token', token_type: 'bearer' };
      mockFetch.setResponseIf((req) => req.headers.Authorization === 'Bearer bad_access_token', '', 401);
      mockFetch.setJSONResponseIf((req) => {
         const params = new URLSearchParams(req.body || '');
         return (
            req.method === 'POST' &&
            params.get('refresh_token') === 'good_refresh_token' &&
            params.get('grant_type') === 'refresh_token' &&
            req.headers['Content-Type'] === 'application/x-www-form-urlencoded'
         );
      }, good_token);
      mockFetch.setJSONResponseIf((req) => req.headers.Authorization === 'Bearer new_access_token', { foo: 'success' });
      localStorage.setItem('access_token', '"bad_access_token"');
      localStorage.setItem('refresh_token', '"good_refresh_token"');

      const TestComponenet = () => {
         const { get } = useAPI();
         const [success, setSuccess] = useState<string>('');
         useEffect(() => {
            const run = async () => {
               const resp = await get('/do/refresh/');
               const data = resp.data || {};
               setSuccess('foo' in data && typeof data.foo === 'string' ? data.foo : 'fail');
            };
            if (success === '') {
               run();
            }
         }, [get, success]);
         return (
            <>
               <div role="status">{success}</div>
            </>
         );
      };
      render(<TestComponenet />);
      await waitFor(() => expect(screen.getByRole('status').textContent).not.toBe(''));
      expect(mockFetch.calls().length).toBeGreaterThan(0);
      let req = mockFetch.calls()[0].request;
      let resp = mockFetch.calls()[0].response;
      expect(req.url).toEqual('/do/refresh/');
      expect(req.method).toEqual('GET');
      expect(req.body).toBeNull();
      expect(req.headers['Authorization']).toBe('Bearer bad_access_token');
      expect(resp.status).toBe(401);

      expect(mockFetch.calls().length).toBeGreaterThan(1);
      req = mockFetch.calls()[1].request;
      resp = mockFetch.calls()[1].response;
      expect(req.url).toEqual('/api/oauth2/token/');
      expect(req.method).toEqual('POST');
      expect(req.body).toBe('refresh_token=good_refresh_token&grant_type=refresh_token');
      expect(req.headers['Authorization']).not.toBeDefined();
      expect(req.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(resp.status).toBe(200);
      expect(JSON.parse(resp.body)).toStrictEqual(good_token);

      expect(mockFetch.calls().length).toBe(3);
      req = mockFetch.calls()[2].request;
      resp = mockFetch.calls()[2].response;
      expect(req.url).toEqual('/do/refresh/');
      expect(req.method).toEqual('GET');
      expect(req.body).toBeNull();
      expect(req.headers['Authorization']).toBe('Bearer new_access_token');
      expect(resp.status).toBe(200);
   });
});
