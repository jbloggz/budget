/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * useAPI.ts: This file contains the useAPI custom hook
 */

import { useCallback, useState } from 'react';
import { useLocalStorage } from 'react-use';
import { apiResponseType, apiTokenType } from '.';
import { isApiTokenType } from '../util';

export const useAPI = () => {
   const [isLoading, setLoading] = useState(true);
   const [currentAccessToken, setCurrentAccessToken, removeAccessToken] = useLocalStorage<string>('access_token');
   const [currentRefreshToken, setCurrentRefreshToken, removeRefreshToken] = useLocalStorage<string>('refresh_token');

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
         const resp = await runRawRequest('POST', '/api/oauth2/token/', { 'Content-Type': 'application/x-www-form-urlencoded' }, creds);
         if (!resp.success) {
            throw new Error('Invalid token');
         }
         if (!isApiTokenType(resp.data)) {
            throw new Error('Token data corrupt or missing in response');
         }
         setCurrentAccessToken(resp.data.access_token);
         setCurrentRefreshToken(resp.data.refresh_token);
         return resp.data;
      },
      [runRawRequest, setCurrentAccessToken, setCurrentRefreshToken]
   );

   const getToken = useCallback(
      async (email: string, password: string): Promise<apiTokenType> => {
         return await runTokenRequest(
            new URLSearchParams({
               username: email,
               password,
               grant_type: 'password',
            })
         );
      },
      [runTokenRequest]
   );

   const clearToken = useCallback(() => {
      removeAccessToken();
      removeRefreshToken();
   }, [removeAccessToken, removeRefreshToken]);

   const runAPIRequest = useCallback(
      async (
         method: 'GET' | 'POST' | 'PUT',
         url: string,
         headers?: { [key: string]: string },
         body?: URLSearchParams | string
      ): Promise<apiResponseType> => {
         if (!headers) {
            headers = {
               Authorization: `Bearer ${currentAccessToken}`,
            };
            if (method !== 'GET') {
               headers['Content-Type'] = 'application/json';
            }
         }
         let resp = await runRawRequest(method, url, headers, body);
         if (resp.status === 401 && currentRefreshToken) {
            /* Attempt a token refresh */
            try {
               const tokResp = await runTokenRequest(
                  new URLSearchParams({
                     refresh_token: currentRefreshToken || '',
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
      [runRawRequest, runTokenRequest, currentRefreshToken, currentAccessToken]
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

   return { isLoading, get, post, put, getToken, clearToken };
};
