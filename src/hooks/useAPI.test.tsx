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
import { useLocalStorage } from 'react-use';
import { mockFetch } from '../mocks';

vi.mock('react-use', async (importOriginal) => {
   const mod = (await importOriginal()) as object;
   return {
      ...mod,
      useLocalStorage: vi.fn(),
   };
});

describe('useAPI', () => {
   beforeEach(() => {
      vi.resetAllMocks();
      vi.mocked(useLocalStorage).mockImplementation((name: string) => [name, vi.fn(), vi.fn()]);
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
      vi.mocked(useLocalStorage).mockImplementation((name: string) => [name === 'access_token' ? 'GETToken' : 'invalid', vi.fn(), vi.fn()]);
      const TestComponenet = () => {
         const api = useAPI();
         useEffect(() => {
            const run = async () => {
               const resp = await api.get('/foo/get/');
               expect(resp.data).toStrictEqual({ hello: 'world' });
            };
            run();
         }, [api]);
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
      mockFetch.setJSONResponse({ hello: 'world' });
      vi.mocked(useLocalStorage).mockImplementation((name: string) => [name === 'access_token' ? 'POSTToken' : 'invalid', vi.fn(), vi.fn()]);
      const TestComponenet = () => {
         const api = useAPI();
         useEffect(() => {
            const run = async () => {
               await api.post('/foo/post/', { msg: 'hello' });
            };
            run();
         }, [api]);
         return <></>;
      };
      render(<TestComponenet />);
      expect(mockFetch.calls().length).toEqual(1);
      const req = mockFetch.calls()[0].request;
      expect(req.url).toEqual('/foo/post/');
      expect(req.method).toEqual('POST');
      expect(req.body).toBe('{"msg":"hello"}');
      expect(req.headers['Authorization']).toEqual('Bearer POSTToken');
      expect(req.headers['Content-Type']).toEqual('application/json');
   });

   it('can make a PUT request with a valid token', async () => {
      mockFetch.setJSONResponse({ hello: 'world' });
      vi.mocked(useLocalStorage).mockImplementation((name: string) => [name === 'access_token' ? 'PUTToken' : 'invalid', vi.fn(), vi.fn()]);
      const TestComponenet = () => {
         const api = useAPI();
         useEffect(() => {
            const run = async () => {
               await api.put('/foo/put/', { msg: 'hello' });
            };
            run();
         }, [api]);
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
      const mockSetStorageAccess = vi.fn();
      const mockSetStorageRefresh = vi.fn();
      vi.mocked(useLocalStorage).mockImplementation((name: string) => [
         name,
         name === 'access_token' ? mockSetStorageAccess : name === 'refresh_token' ? mockSetStorageRefresh : vi.fn(),
         vi.fn(),
      ]);
      const TestComponenet = () => {
         const api = useAPI();
         const [accessToken, setAccessToken] = useState<string | undefined>();
         const [refreshToken, setRefreshToken] = useState<string | undefined>();
         const [tokenType, setTokenType] = useState<string | undefined>();
         const [ready, setReady] = useState<string>('no');
         useEffect(() => {
            const run = async () => {
               const resp = await api.get_token('joe@foo.com', 'foobar');
               setAccessToken(resp.access_token);
               setRefreshToken(resp.refresh_token);
               setTokenType(resp.token_type);
               setReady('yes');
            };
            run();
         }, [api]);
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
      expect(mockSetStorageAccess).toHaveBeenCalledOnce();
      expect(mockSetStorageAccess).toHaveBeenCalledWith('dummy_access_token');
      expect(mockSetStorageRefresh).toHaveBeenCalledOnce();
      expect(mockSetStorageRefresh).toHaveBeenCalledWith('dummy_refresh_token');
   });
});
