/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * AuthProvider.test.tsx: This file contains the tests for the AuthProvider
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { apiResponseType, useAPI } from '.';
import { useEffect, useState } from 'react';
import { mockFetch } from '../mocks';

describe('useAPI', () => {
   beforeEach(() => {
      vi.resetAllMocks();
      mockFetch.reset();
   });

   it('can call useAPI', () => {
      const TestComponent = () => {
         const api = useAPI();
         return <div role="test">{api ? 'yes' : 'no'}</div>;
      };
      render(<TestComponent />);
      const val = screen.getByRole('test');
      expect(val.textContent).toBe('yes');
   });

   it('can make a GET request with a valid token', async () => {
      mockFetch.setJSONResponse({ hello: 'world' });
      localStorage.setItem('access_token', '"GETToken"');
      const TestComponent = () => {
         const [done, setDone] = useState('no');
         const { get } = useAPI();
         useEffect(() => {
            const run = async () => {
               await get('/foo/get/');
               setDone('done');
            };
            run();
         }, []); // eslint-disable-line
         return <p>{done}</p>;
      };
      render(<TestComponent />);
      await waitFor(() => screen.getByText('done'));
      expect(mockFetch.calls().length).toEqual(1);
      const req = mockFetch.calls()[0].request;
      const resp = mockFetch.calls()[0].response;
      expect(req.url).toEqual('/foo/get/');
      expect(req.method).toEqual('GET');
      expect(req.body).toBeNull();
      expect(req.headers['Authorization']).toEqual('Bearer GETToken');
      expect(req.headers['Content-Type']).not.toBeDefined();
      expect(resp.status).toBe(200);
      expect(resp.body).toBe('{"hello":"world"}');
   });

   it('can make a POST request with a valid token', async () => {
      mockFetch.setJSONResponse({ hello: 'world' }, 201);
      localStorage.setItem('access_token', '"POSTToken"');
      const TestComponent = () => {
         const { post } = useAPI();
         const [done, setDone] = useState('no');
         useEffect(() => {
            const run = async () => {
               await post('/foo/post/', { msg: 'hello' });
               setDone('done');
            };
            run();
         }, []); // eslint-disable-line
         return <p>{done}</p>;
      };
      render(<TestComponent />);
      await waitFor(() => screen.getByText('done'));
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
      const TestComponent = () => {
         const { put } = useAPI();
         const [done, setDone] = useState('no');
         useEffect(() => {
            const run = async () => {
               await put('/foo/put/', { msg: 'hello' });
               setDone('done');
            };
            run();
         }, []); // eslint-disable-line
         return <p>{done}</p>;
      };
      render(<TestComponent />);
      await waitFor(() => screen.getByText('done'));
      expect(mockFetch.calls().length).toEqual(1);
      const req = mockFetch.calls()[0].request;
      const resp = mockFetch.calls()[0].response;
      expect(req.url).toEqual('/foo/put/');
      expect(req.method).toEqual('PUT');
      expect(req.body).toBe('{"msg":"hello"}');
      expect(req.headers['Authorization']).toBe('Bearer PUTToken');
      expect(req.headers['Content-Type']).toBe('application/json');
      expect(resp.status).toBe(200);
   });

   it('can clear a token', async () => {
      mockFetch.setResponse('', 401);
      mockFetch.setResponseIf((req) => req.headers.Authorization === 'Bearer good_access_token', '[]', 200);
      localStorage.setItem('access_token', '"good_access_token"');
      let sent = false;
      let failResp: apiResponseType = { success: true, status: 200 };

      const TestComponent = () => {
         const { get, clearToken, accessToken } = useAPI();
         const [done, setDone] = useState('no');
         useEffect(() => {
            const run = async () => {
               if (!sent) {
                  sent = true;
                  await get('/foo/clear1/');
               }
               clearToken();
               await waitFor(() => expect(accessToken).toBeFalsy());
               failResp = await get('/foo/clear2/');
               setDone('done');
            };
            run();
         }, [accessToken, clearToken, get]);
         return <p>{done}</p>;
      };
      render(<TestComponent />);
      await waitFor(() => screen.getByText('done'));
      expect(mockFetch.calls().length).toBe(1);
      const resp = mockFetch.calls()[0].response;
      expect(resp.status).toBe(200);
      expect(failResp.status).toBe(401);
      expect(failResp.success).toBe(false);
   });

   it('can make a successful "remember" login request and receive a token', async () => {
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
      mockFetch.setResponseIf((req) => req.headers.Authorization === 'Bearer dummy_access_token', 'null', 200);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      let sent = false;
      const TestComponent = () => {
         const { get, getToken, accessToken, refreshToken } = useAPI();
         const [tokenType, setTokenType] = useState<string | undefined>();
         const [ready, setReady] = useState<string>('no');
         useEffect(() => {
            const run = async () => {
               if (!sent) {
                  sent = true;
                  const resp = await getToken('joe@foo.com', 'foobar', true);
                  setTokenType(resp.token_type);
               }
               if (accessToken) {
                  await get('/foo/remember');
                  setReady('yes');
               }
            };
            run();
         }, [accessToken, get, getToken]);
         return (
            <>
               <div role="ready">{ready}</div>
               <div role="access">{accessToken}</div>
               <div role="refresh">{refreshToken}</div>
               <div role="type">{tokenType}</div>
            </>
         );
      };
      render(<TestComponent />);
      await waitFor(() => expect(screen.getByRole('ready').textContent).toBe('yes'));
      expect(mockFetch.calls().length).toEqual(2);
      const req = mockFetch.calls()[0].request;
      expect(req.url).toEqual('/api/oauth2/token/');
      expect(req.method).toEqual('POST');
      expect(req.body).toBe('username=joe%40foo.com&password=foobar&remember=true&grant_type=password');
      expect(req.headers['Authorization']).not.toBeDefined();
      expect(req.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(screen.getByRole('access').textContent).toBe('dummy_access_token');
      expect(screen.getByRole('refresh').textContent).toBe('dummy_refresh_token');
      expect(screen.getByRole('type').textContent).toBe('bearer');
      expect(localStorage.getItem('access_token')).toBe('"dummy_access_token"');
      expect(localStorage.getItem('refresh_token')).toBe('"dummy_refresh_token"');
      expect(localStorage.getItem('remember_me')).toBe('true');
      expect(mockFetch.calls()[1].response.status).toBe(200);
   });

   it('can make a successful "no remember" login request and receive a token', async () => {
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
      mockFetch.setResponseIf((req) => req.headers.Authorization === 'Bearer dummy_access_token', 'null', 200);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      let sent = false;
      const TestComponent = () => {
         const { get, getToken, accessToken, refreshToken } = useAPI();
         const [tokenType, setTokenType] = useState<string | undefined>();
         const [ready, setReady] = useState<string>('no');
         useEffect(() => {
            const run = async () => {
               if (!sent) {
                  sent = true;
                  const resp = await getToken('joe@foo.com', 'foobar', false);
                  setTokenType(resp.token_type);
               }
               if (accessToken) {
                  await get('/foo/remember');
                  setReady('yes');
               }
            };
            run();
         }, [accessToken, get, getToken]);
         return (
            <>
               <div role="ready">{ready}</div>
               <div role="access">{accessToken}</div>
               <div role="refresh">{refreshToken}</div>
               <div role="type">{tokenType}</div>
            </>
         );
      };
      render(<TestComponent />);
      await waitFor(() => expect(screen.getByRole('ready').textContent).toBe('yes'));
      expect(mockFetch.calls().length).toEqual(2);
      const req = mockFetch.calls()[0].request;
      expect(req.url).toEqual('/api/oauth2/token/');
      expect(req.method).toEqual('POST');
      expect(req.body).toBe('username=joe%40foo.com&password=foobar&remember=false&grant_type=password');
      expect(req.headers['Authorization']).not.toBeDefined();
      expect(req.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(screen.getByRole('access').textContent).toBe('dummy_access_token');
      expect(screen.getByRole('refresh').textContent).toBe('dummy_refresh_token');
      expect(screen.getByRole('type').textContent).toBe('bearer');
      expect(localStorage.getItem('access_token')).toBe(null);
      expect(localStorage.getItem('refresh_token')).toBe(null);
      expect(localStorage.getItem('remember_me')).toBe(null);
      expect(mockFetch.calls()[1].response.status).toBe(200);
   });

   it('can check a valid access_token', async () => {
      mockFetch.setResponseIf((req) => req.headers.Authorization === 'Bearer CheckToken', '', 204);
      localStorage.setItem('access_token', '"CheckToken"');
      const TestComponent = () => {
         const { get } = useAPI();
         const [done, setDone] = useState('no');
         useEffect(() => {
            const run = async () => {
               await get('/api/oauth2/token/');
               setDone('done');
            };
            run();
         }, []); // eslint-disable-line
         return <p>{done}</p>;
      };
      render(<TestComponent />);
      await waitFor(() => screen.getByText('done'));
      expect(mockFetch.calls().length).toEqual(1);
      const req = mockFetch.calls()[0].request;
      const resp = mockFetch.calls()[0].response;
      expect(req.url).toEqual('/api/oauth2/token/');
      expect(req.method).toEqual('GET');
      expect(req.body).toBe(null);
      expect(req.headers['Authorization']).toBe('Bearer CheckToken');
      expect(resp.status).toBe(204);
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

      const TestComponent = () => {
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
         }, []); // eslint-disable-line
         return (
            <>
               <div role="status">{success}</div>
            </>
         );
      };
      render(<TestComponent />);
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
      expect(req.body).toBe('refresh_token=good_refresh_token&remember=false&grant_type=refresh_token');
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

   it("doesn't make a request if there is no access token", async () => {
      mockFetch.setResponse('', 401);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      let resp: apiResponseType = { success: true, status: 200 };

      const TestComponent = () => {
         const { get } = useAPI();
         const [done, setDone] = useState('no');
         useEffect(() => {
            const run = async () => {
               resp = await get('/do/refresh/');
               setDone('done');
            };
            run();
         }, [get]);
         return <p>{done}</p>;
      };
      render(<TestComponent />);
      await waitFor(() => screen.getByText('done'));
      expect(mockFetch.calls().length).toBe(0);
      expect(resp.status).toBe(401);
      expect(resp.success).toBe(false);
   });

   it('removes tokens from local storage on unsuccessful login', async () => {
      mockFetch.setResponse('', 401);
      localStorage.setItem('access_token', '"testAccessToken"');
      localStorage.setItem('refresh_token', '"testRefreshToken"');
      let sent = false;
      const TestComponent = () => {
         const { get, getToken, accessToken } = useAPI();
         const [done, setDone] = useState('no');
         useEffect(() => {
            const run = async () => {
               if (!sent) {
                  sent = true;
                  try {
                     await getToken('joe@foo.com', 'foobar', true);
                  } catch {
                     /* Ignore */
                  }
                  setDone('done');
               }
            };
            run();
         }, [accessToken, get, getToken]);
         return <p>{done}</p>;
      };
      render(<TestComponent />);
      await waitFor(() => screen.getByText('done'));
      expect(mockFetch.calls().length).toEqual(1);
      const req = mockFetch.calls()[0].request;
      expect(req.url).toEqual('/api/oauth2/token/');
      expect(req.method).toEqual('POST');
      expect(req.body).toBe('username=joe%40foo.com&password=foobar&remember=true&grant_type=password');
      expect(req.headers['Authorization']).not.toBeDefined();
      expect(req.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(localStorage.getItem('access_token')).toBe(null);
      expect(localStorage.getItem('refresh_token')).toBe(null);
      expect(localStorage.getItem('remember_me')).toBe(null);
   });
});
