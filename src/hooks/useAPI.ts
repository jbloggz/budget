/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * useAPI.ts: This file contains the useAPI custom hook
 */

import { useCallback, useState } from 'react';
import { useLocalStorage } from 'react-use';
import jwt_decode from "jwt-decode";
import { apiResponseType, apiTokenType } from '.';
import { isApiTokenType } from '../util';
import { apiJWTType } from './hooks.types';

export const useAPI = () => {
   const [isLoading, setLoading] = useState(true);
   const [storageAccessToken, setStorageAccessToken, removeStorageAccessToken] = useLocalStorage<string>('access_token');
   const [storageRefreshToken, setStorageRefreshToken, removeStorageRefreshToken] = useLocalStorage<string>('refresh_token');
   const [rememberMe, setRememberMe, removeRememberMe] = useLocalStorage<boolean>('remember_me');
   const [accessToken, setAccessToken] = useState(storageAccessToken);
   const [refreshToken, setRefreshToken] = useState(storageRefreshToken);

   const clearToken = useCallback(() => {
      removeStorageAccessToken();
      removeStorageRefreshToken();
      removeRememberMe();
      setAccessToken(undefined);
      setRefreshToken(undefined);
   }, [removeStorageAccessToken, removeStorageRefreshToken, removeRememberMe]);

   const getLoggedInUser = useCallback(() => {
      if (!accessToken) {
         return '';
      }
      const jwt = jwt_decode<apiJWTType>(accessToken);
      return jwt.sub;
   }, [accessToken]);

   const runRawRequest = useCallback(
      async (
         method: 'GET' | 'POST' | 'PUT',
         url: string,
         headers: { [key: string]: string },
         body?: URLSearchParams | string
      ): Promise<apiResponseType> => {
         let status = -1;
         try {
            setLoading(true);
            const resp = await fetch(url, { method, headers, body });
            status = resp.status;
            if (status == 204) {
               /* Success with no content */
               return { success: true, status };
            }
            const data = await resp.json();
            if (!resp.ok) {
               return { success: false, errmsg: data.detail, status };
            }
            return { success: status >= 200 && status < 300, data, status };
         } catch (error) {
            return { success: false, errmsg: error instanceof Error ? error.message : String(error), status };
         } finally {
            setLoading(false);
         }
      },
      []
   );

   const runTokenRequest = useCallback(
      async (creds: URLSearchParams): Promise<apiTokenType> => {
         clearToken();
         const resp = await runRawRequest('POST', '/api/oauth2/token/', { 'Content-Type': 'application/x-www-form-urlencoded' }, creds);
         if (!resp.success) {
            throw new Error('Invalid credentials');
         }
         if (!isApiTokenType(resp.data)) {
            throw new Error('Token data corrupt or missing in response');
         }
         setAccessToken(resp.data.access_token);
         setRefreshToken(resp.data.refresh_token);
         if (creds.get('remember') === 'true') {
            setStorageAccessToken(resp.data.access_token);
            setStorageRefreshToken(resp.data.refresh_token);
            setRememberMe(true);
         }
         return resp.data;
      },
      [runRawRequest, setStorageAccessToken, setStorageRefreshToken, clearToken, setRememberMe]
   );

   const getToken = useCallback(
      async (email: string, password: string, remember: boolean): Promise<apiTokenType> => {
         return await runTokenRequest(
            new URLSearchParams({
               username: email,
               password,
               remember: remember ? 'true' : 'false',
               grant_type: 'password',
            })
         );
      },
      [runTokenRequest]
   );

   const runAPIRequest = useCallback(
      async (
         method: 'GET' | 'POST' | 'PUT',
         url: string,
         headers?: { [key: string]: string },
         body?: URLSearchParams | string
      ): Promise<apiResponseType> => {
         if (!accessToken) {
            return {
               status: 401,
               success: false,
               errmsg: 'Missing access token',
            };
         }
         if (!headers) {
            headers = {
               Authorization: `Bearer ${accessToken}`,
            };
            if (method !== 'GET') {
               headers['Content-Type'] = 'application/json';
            }
         }
         let resp = await runRawRequest(method, url, headers, body);
         if (resp.status === 401 && refreshToken) {
            /* Attempt a token refresh */
            try {
               const tokResp = await runTokenRequest(
                  new URLSearchParams({
                     refresh_token: refreshToken || '',
                     remember: rememberMe ? 'true' : 'false',
                     grant_type: 'refresh_token',
                  })
               );
               headers.Authorization = `Bearer ${tokResp.access_token}`;
               resp = await runRawRequest(method, url, headers, body);
            } catch (e) {
               /* Ignore any error */
            }
         }
         return resp;
      },
      [runRawRequest, runTokenRequest, refreshToken, accessToken, rememberMe]
   );

   const get = useCallback(
      async (url: string): Promise<apiResponseType> => {
         return runAPIRequest('GET', url);
      },
      [runAPIRequest]
   );

   const post = useCallback(
      async (url: string, body: unknown): Promise<apiResponseType> => {
         return runAPIRequest('POST', url, undefined, JSON.stringify(body));
      },
      [runAPIRequest]
   );

   const put = useCallback(
      async (url: string, body: unknown): Promise<apiResponseType> => {
         return runAPIRequest('PUT', url, undefined, JSON.stringify(body));
      },
      [runAPIRequest]
   );

   return { isLoading, get, post, put, getToken, clearToken, accessToken, refreshToken, getLoggedInUser };
};
