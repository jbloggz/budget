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
import jwtEncode from 'jwt-encode';
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
      const now = Math.floor(Date.now() / 1000);
      const accessToken = jwtEncode({ sub: 'joe@example.com', iat: now - 300, exp: now + 300 }, 'secret');
      mockFetch.setJSONResponse({ hello: 'world' });
      localStorage.setItem('access_token', accessToken);
      const TestComponent = () => {
         const [value, setValue] = useState('');
         const api = useAPI();
         useEffect(() => {
            const run = async () => {
               const resp = await api.request<{ hello: string }>({ method: 'GET', url: '/foo/get/' });
               setValue(resp.data.hello);
            };
            run();
         }, []); // eslint-disable-line
         return <p>{value}</p>;
      };
      render(<TestComponent />);
      await waitFor(() => screen.getByText('world'));
      expect(mockFetch.calls().length).toEqual(1);
      const req = mockFetch.calls()[0].request;
      const resp = mockFetch.calls()[0].response;
      expect(req.url).toEqual('/foo/get/');
      expect(req.method).toEqual('GET');
      expect(req.body).toBeNull();
      expect(req.headers['Authorization']).toEqual('Bearer ' + accessToken);
      expect(req.headers['Content-Type']).not.toBeDefined();
      expect(resp.status).toBe(200);
      expect(resp.body).toBe('{"hello":"world"}');
   });

   it('can make a POST request with a valid token', async () => {
      const now = Math.floor(Date.now() / 1000);
      const accessToken = jwtEncode({ sub: 'joe@example.com', iat: now - 300, exp: now + 300 }, 'secret');
      mockFetch.setJSONResponse({ post_hello: 'post_world' }, 201);
      localStorage.setItem('access_token', accessToken);
      const TestComponent = () => {
         const [value, setValue] = useState('');
         const api = useAPI();
         useEffect(() => {
            const run = async () => {
               const resp = await api.request<{ post_hello: string }>({ method: 'POST', url: '/foo/post/', body: '{"msg":"hello"}' });
               setValue(resp.data.post_hello);
            };
            run();
         }, []); // eslint-disable-line
         return <p>{value}</p>;
      };
      render(<TestComponent />);
      await waitFor(() => screen.getByText('post_world'));
      expect(mockFetch.calls().length).toEqual(1);
      const req = mockFetch.calls()[0].request;
      const resp = mockFetch.calls()[0].response;
      expect(req.url).toEqual('/foo/post/');
      expect(req.method).toEqual('POST');
      expect(req.body).toBe('{"msg":"hello"}');
      expect(req.headers['Authorization']).toEqual('Bearer ' + accessToken);
      expect(req.headers['Content-Type']).toEqual('application/json');
      expect(resp.status).toBe(201);
   });

   it('can make a PUT request with a valid token', async () => {
      const now = Math.floor(Date.now() / 1000);
      const accessToken = jwtEncode({ sub: 'joe@example.com', iat: now - 300, exp: now + 300 }, 'secret');
      mockFetch.setJSONResponse({ put_hello: 'put_world' }, 201);
      localStorage.setItem('access_token', accessToken);
      const TestComponent = () => {
         const [value, setValue] = useState('');
         const api = useAPI();
         useEffect(() => {
            const run = async () => {
               const resp = await api.request<{ put_hello: string }>({ method: 'PUT', url: '/foo/post/', body: '{"msg":"hello"}' });
               setValue(resp.data.put_hello);
            };
            run();
         }, []); // eslint-disable-line
         return <p>{value}</p>;
      };
      render(<TestComponent />);
      await waitFor(() => screen.getByText('put_world'));
      expect(mockFetch.calls().length).toEqual(1);
      const req = mockFetch.calls()[0].request;
      const resp = mockFetch.calls()[0].response;
      expect(req.url).toEqual('/foo/post/');
      expect(req.method).toEqual('PUT');
      expect(req.body).toBe('{"msg":"hello"}');
      expect(req.headers['Authorization']).toEqual('Bearer ' + accessToken);
      expect(req.headers['Content-Type']).toEqual('application/json');
      expect(resp.status).toBe(201);
   });

   it('can make a DELETE request with a valid token', async () => {
      const now = Math.floor(Date.now() / 1000);
      const accessToken = jwtEncode({ sub: 'joe@example.com', iat: now - 300, exp: now + 300 }, 'secret');
      mockFetch.setJSONResponse({ delete_hello: 'delete_world' });
      localStorage.setItem('access_token', accessToken);
      const TestComponent = () => {
         const [value, setValue] = useState('');
         const api = useAPI();
         useEffect(() => {
            const run = async () => {
               const resp = await api.request<{ delete_hello: string }>({ method: 'DELETE', url: '/foo/delete/' });
               setValue(resp.data.delete_hello);
            };
            run();
         }, []); // eslint-disable-line
         return <p>{value}</p>;
      };
      render(<TestComponent />);
      await waitFor(() => screen.getByText('delete_world'));
      expect(mockFetch.calls().length).toEqual(1);
      const req = mockFetch.calls()[0].request;
      const resp = mockFetch.calls()[0].response;
      expect(req.url).toEqual('/foo/delete/');
      expect(req.method).toEqual('DELETE');
      expect(req.headers['Authorization']).toEqual('Bearer ' + accessToken);
      expect(req.headers['Content-Type']).toEqual('application/json');
      expect(resp.status).toBe(200);
   });

   it('can clear token by logging out', async () => {
      const now = Math.floor(Date.now() / 1000);
      const accessToken = jwtEncode({ sub: 'joe@example.com', iat: now - 300, exp: now + 300 }, 'secret');
      mockFetch.setResponse('', 401);
      mockFetch.setResponseIf((req) => req.headers.Authorization === 'Bearer ' + accessToken, '[]', 200);
      localStorage.setItem('access_token', accessToken);

      const TestComponent = () => {
         const api = useAPI();
         const [value, setValue] = useState('');
         useEffect(() => {
            const run = async () => {
               try {
                  await api.request({ method: 'GET', url: '/foo/get/' });
                  setValue('success');
               } catch (e) {
                  setValue(e instanceof Error ? e.message : 'Unknown Error');
               }
            };
            run();
         }, []); // eslint-disable-line
         return <p>{value}</p>;
      };

      const LogoutComponent = () => {
         const api = useAPI();

         useEffect(() => {
            api.logout();
         }, []); // eslint-disable-line

         return <p>logout</p>;
      };

      render(<TestComponent />);
      await waitFor(() => screen.getByText('success'));

      render(<LogoutComponent />);
      await waitFor(() => screen.getByText('logout'));
      expect(localStorage.getItem('access_token')).toBe(null);

      render(<TestComponent />);
      await waitFor(() => screen.getByText('Missing access token'));
   });

   it('can make a successful "remember" login request and receive a token', async () => {
      const now = Math.floor(Date.now() / 1000);
      const accessToken = jwtEncode({ sub: 'joe@example.com', iat: now, exp: now + 300 }, 'secret');
      const refreshToken = jwtEncode({ sub: 'joe@example.com', iat: now, exp: now + 3000 }, 'secret');
      mockFetch.setResponse('', 401);
      mockFetch.setJSONResponseIf(
         (req) => {
            const params = new URLSearchParams(req.body || '');
            return (
               params.get('username') === 'joe@example.com' &&
               params.get('password') === 'foobar' &&
               params.get('grant_type') === 'password' &&
               req.headers['Content-Type'] === 'application/x-www-form-urlencoded'
            );
         },
         { access_token: accessToken, refresh_token: refreshToken, token_type: 'bearer' }
      );
      mockFetch.setResponseIf((req) => req.headers.Authorization === 'Bearer ' + accessToken, '{"msg":"success"}', 200);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      const LoginComponent = () => {
         const api = useAPI();
         useEffect(() => {
            const run = async () => {
               await api.login('joe@example.com', 'foobar', true);
            };
            run();
         }, []); // eslint-disable-line
         return <p>{api.tokenData().sub}</p>;
      };

      render(<LoginComponent />);
      await waitFor(() => screen.getByText('joe@example.com'));
      expect(mockFetch.calls().length).toEqual(1);
      const req = mockFetch.calls()[0].request;
      const resp = mockFetch.calls()[0].response;
      expect(resp.status).toBe(200);
      expect(req.url).toEqual('/api/oauth2/token/');
      expect(req.method).toEqual('POST');
      expect(req.body).toBe('username=joe%40example.com&password=foobar&remember=true&grant_type=password');
      expect(req.headers['Authorization']).not.toBeDefined();
      expect(req.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(localStorage.getItem('access_token')).toBe(accessToken);
      expect(localStorage.getItem('refresh_token')).toBe(refreshToken);

      const TestComponent = () => {
         const api = useAPI();
         const [value, setValue] = useState('');
         useEffect(() => {
            const run = async () => {
               const resp = await api.request<{ msg: string }>({ method: 'GET', url: '/foo/remember' });
               setValue(resp.data.msg);
            };
            run();
         }, []); // eslint-disable-line
         return <p>{value}</p>;
      };
      render(<TestComponent />);
      await waitFor(() => screen.getByText('success'));
   });

   it('can make a successful "no remember" login request and receive a token', async () => {
      const now = Math.floor(Date.now() / 1000);
      const accessToken = jwtEncode({ sub: 'joe@example.com', iat: now, exp: now + 300 }, 'secret');
      const refreshToken = jwtEncode({ sub: 'joe@example.com', iat: now, exp: now + 3000 }, 'secret');
      mockFetch.setResponse('', 401);
      mockFetch.setJSONResponseIf(
         (req) => {
            const params = new URLSearchParams(req.body || '');
            return (
               params.get('username') === 'joe@example.com' &&
               params.get('password') === 'foobar' &&
               params.get('grant_type') === 'password' &&
               req.headers['Content-Type'] === 'application/x-www-form-urlencoded'
            );
         },
         { access_token: accessToken, refresh_token: refreshToken, token_type: 'bearer' }
      );
      mockFetch.setResponseIf((req) => req.headers.Authorization === 'Bearer ' + accessToken, '{"msg":"success"}', 200);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      const LoginComponent = () => {
         const api = useAPI();
         useEffect(() => {
            const run = async () => {
               await api.login('joe@example.com', 'foobar', false);
            };
            run();
         }, []); // eslint-disable-line
         return <p>{api.tokenData().sub}</p>;
      };

      render(<LoginComponent />);
      await waitFor(() => screen.getByText('joe@example.com'));
      expect(mockFetch.calls().length).toEqual(1);
      const req = mockFetch.calls()[0].request;
      const resp = mockFetch.calls()[0].response;
      expect(resp.status).toBe(200);
      expect(req.url).toEqual('/api/oauth2/token/');
      expect(req.method).toEqual('POST');
      expect(req.body).toBe('username=joe%40example.com&password=foobar&remember=false&grant_type=password');
      expect(req.headers['Authorization']).not.toBeDefined();
      expect(req.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(localStorage.getItem('access_token')).toBe(null);
      expect(localStorage.getItem('refresh_token')).toBe(null);
      expect(sessionStorage.getItem('access_token')).toBe(accessToken);
      expect(sessionStorage.getItem('refresh_token')).toBe(refreshToken);

      const TestComponent = () => {
         const api = useAPI();
         const [value, setValue] = useState('');
         useEffect(() => {
            const run = async () => {
               const resp = await api.request<{ msg: string }>({ method: 'GET', url: '/foo/no_remember' });
               setValue(resp.data.msg);
            };
            run();
         }, []); // eslint-disable-line
         return <p>{value}</p>;
      };
      render(<TestComponent />);
      await waitFor(() => screen.getByText('success'));
   });

   it('can check a valid access_token', async () => {
      const now = Math.floor(Date.now() / 1000);
      const accessToken = jwtEncode({ sub: 'joe@example.com', iat: now, exp: now + 300 }, 'secret');
      mockFetch.setResponseIf((req) => req.headers.Authorization === 'Bearer ' + accessToken, '', 204);
      localStorage.setItem('access_token', accessToken);
      const TestComponent = () => {
         const api = useAPI();
         const [done, setDone] = useState('no');
         useEffect(() => {
            const run = async () => {
               await api.request({ method: 'GET', url: '/api/oauth2/token/' });
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
      expect(req.headers['Authorization']).toBe('Bearer ' + accessToken);
      expect(resp.status).toBe(204);
   });

   it('can refresh a token if a request is denied', async () => {
      const now = Math.floor(Date.now() / 1000);
      const oldAccessToken = jwtEncode({ sub: 'joe@example.com', iat: now - 600, exp: now - 300 }, 'secret');
      const accessToken = jwtEncode({ sub: 'joe@example.com', iat: now, exp: now + 300 }, 'secret');
      const refreshToken = jwtEncode({ sub: 'joe@example.com', iat: now, exp: now + 3000 }, 'secret');
      const good_token = { access_token: accessToken, refresh_token: refreshToken, token_type: 'bearer' };
      localStorage.setItem('access_token', oldAccessToken);
      localStorage.setItem('refresh_token', refreshToken);

      mockFetch.setResponseIf((req) => req.headers.Authorization === 'Bearer ' + oldAccessToken, '', 401);
      mockFetch.setJSONResponseIf((req) => {
         const params = new URLSearchParams(req.body || '');
         return (
            req.method === 'POST' &&
            params.get('refresh_token') === refreshToken &&
            params.get('grant_type') === 'refresh_token' &&
            req.headers['Content-Type'] === 'application/x-www-form-urlencoded'
         );
      }, good_token);
      mockFetch.setJSONResponseIf((req) => req.headers.Authorization === 'Bearer ' + accessToken, { foo: 'success' });

      const TestComponent = () => {
         const api = useAPI();
         const [success, setSuccess] = useState<string>('');
         useEffect(() => {
            const run = async () => {
               const resp = await api.request<{ foo: string }>({ method: 'GET', url: '/do/refresh/' });
               setSuccess(resp.data.foo);
            };
            if (success === '') {
               run();
            }
         }, []); // eslint-disable-line
         return <p>{success}</p>;
      };
      render(<TestComponent />);
      await waitFor(() => screen.getByText('success'));
      expect(mockFetch.calls().length).toBeGreaterThan(0);
      let req = mockFetch.calls()[0].request;
      let resp = mockFetch.calls()[0].response;
      expect(req.url).toEqual('/do/refresh/');
      expect(req.method).toEqual('GET');
      expect(req.body).toBeNull();
      expect(req.headers['Authorization']).toBe('Bearer ' + oldAccessToken);
      expect(resp.status).toBe(401);

      expect(mockFetch.calls().length).toBeGreaterThan(1);
      req = mockFetch.calls()[1].request;
      resp = mockFetch.calls()[1].response;
      expect(req.url).toEqual('/api/oauth2/token/');
      expect(req.method).toEqual('POST');
      expect(req.body).toBe(`refresh_token=${refreshToken}&remember=true&grant_type=refresh_token`);
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
      expect(req.headers['Authorization']).toBe('Bearer ' + accessToken);
      expect(resp.status).toBe(200);
   });

   it("doesn't make a request if there is no access token", async () => {
      mockFetch.setResponse('', 401);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      const TestComponent = () => {
         const api = useAPI();
         const [done, setDone] = useState('no');
         useEffect(() => {
            const run = async () => {
               try {
                  await api.request({ method: 'GET', url: '/foo/no_token/' });
                  setDone('success');
               } catch (e) {
                  setDone(e instanceof Error ? e.message : 'Unknown Error');
               }
            };
            run();
         }, []); // eslint-disable-line
         return <p>{done}</p>;
      };
      render(<TestComponent />);
      await waitFor(() => screen.getByText('Missing access token'));
   });

   it('removes tokens from local storage on unsuccessful login', async () => {
      const now = Math.floor(Date.now() / 1000);
      const accessToken = jwtEncode({ sub: 'joe@example.com', iat: now, exp: now + 300 }, 'secret');
      const refreshToken = jwtEncode({ sub: 'joe@example.com', iat: now, exp: now + 3000 }, 'secret');
      mockFetch.setResponse('', 401);
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      sessionStorage.setItem('access_token', accessToken);
      sessionStorage.setItem('refresh_token', refreshToken);
      const TestComponent = () => {
         const api = useAPI();
         const [done, setDone] = useState('no');
         useEffect(() => {
            const run = async () => {
               try {
                  await api.login('joe@foo.com', 'foobar', true);
               } catch {
                  /* Ignore */
               }
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
      expect(req.url).toEqual('/api/oauth2/token/');
      expect(req.method).toEqual('POST');
      expect(req.body).toBe('username=joe%40foo.com&password=foobar&remember=true&grant_type=password');
      expect(req.headers['Authorization']).not.toBeDefined();
      expect(req.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      expect(localStorage.getItem('access_token')).toBe(null);
      expect(localStorage.getItem('refresh_token')).toBe(null);
      expect(localStorage.getItem('remember_me')).toBe(null);
      expect(sessionStorage.getItem('access_token')).toBe(null);
      expect(sessionStorage.getItem('refresh_token')).toBe(null);
      expect(sessionStorage.getItem('remember_me')).toBe(null);
   });

   it('can get token data', async () => {
      const now = Math.floor(Date.now() / 1000);
      const accessToken = jwtEncode({ sub: 'joe@example.com', iat: now, exp: now + 300 }, 'secret');
      localStorage.setItem('access_token', accessToken);
      const TestComponent = () => {
         const api = useAPI();
         const data = api.tokenData();
         return <p role="test">{data.sub}</p>;
      };
      render(<TestComponent />);
      const val = screen.getByRole('test');
      expect(val.textContent).toBe('joe@example.com');
   });

   it('throws if validation fails', async () => {
      const now = Math.floor(Date.now() / 1000);
      const accessToken = jwtEncode({ sub: 'joe@example.com', iat: now - 300, exp: now + 300 }, 'secret');
      mockFetch.setJSONResponse({ hello: 1 });
      localStorage.setItem('access_token', accessToken);

      interface resultType {
         hello: string;
      }
      const validate = (data: object): data is resultType => {
         return typeof (data as resultType).hello === 'string';
      };

      const TestComponent = () => {
         const [value, setValue] = useState('waiting');
         const api = useAPI();
         useEffect(() => {
            const run = async () => {
               try {
                  const resp = await api.request<{ hello: string }>({ method: 'GET', url: '/foo/get/', validate });
                  setValue(resp.data.hello);
               } catch (e) {
                  setValue(e instanceof Error ? e.message : 'Unknown Error');
               }
            };
            run();
         }, []); // eslint-disable-line
         return <p role="test">{value}</p>;
      };
      render(<TestComponent />);
      const val = screen.getByRole('test');
      await waitFor(() => expect(val.textContent).not.toBe('waiting'));
      expect(val.textContent).toBe('Response validation failed');
   });

   it('succeeds if validation passes', async () => {
      const now = Math.floor(Date.now() / 1000);
      const accessToken = jwtEncode({ sub: 'joe@example.com', iat: now - 300, exp: now + 300 }, 'secret');
      mockFetch.setJSONResponse({ hello: 'world' });
      localStorage.setItem('access_token', accessToken);

      interface resultType {
         hello: string;
      }
      const validate = (data: object): data is resultType => {
         return typeof (data as resultType).hello === 'string';
      };

      const TestComponent = () => {
         const [value, setValue] = useState('waiting');
         const api = useAPI();
         useEffect(() => {
            const run = async () => {
               try {
                  const resp = await api.request<{ hello: string }>({ method: 'GET', url: '/foo/get/', validate });
                  setValue(resp.data.hello);
               } catch (e) {
                  setValue(e instanceof Error ? e.message : 'Unknown Error');
               }
            };
            run();
         }, []); // eslint-disable-line
         return <p role="test">{value}</p>;
      };
      render(<TestComponent />);
      const val = screen.getByRole('test');
      await waitFor(() => expect(val.textContent).not.toBe('waiting'));
      expect(val.textContent).toBe('world');
   });
});
