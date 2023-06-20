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
   const [accessToken, setAccessToken] = useLocalStorage('access_token');
   const [, setRefreshToken] = useLocalStorage('refresh_token');

   const runRequest = useCallback(
      async (
         method: 'GET' | 'POST' | 'PUT',
         url: string,
         body?: URLSearchParams | string,
         headers?: { [key: string]: string }
      ): Promise<apiResponseType> => {
         try {
            setLoading(true);
            if (!headers) {
               headers = {
                  Authorization: `Bearer ${accessToken}`,
               };
               if (method !== 'GET') {
                  headers['Content-Type'] = 'application/json';
               }
            }
            const resp = await fetch(url, { method, headers, body });
            const data = await resp.json();
            if (!resp.ok) {
               return { success: false, errmsg: data.detail };
            }
            return { success: true, data };
         } catch (error) {
            return { success: false, errmsg: error instanceof Error ? error.message : String(error) };
         } finally {
            setLoading(false);
         }
      },
      [accessToken]
   );

   const get = useCallback(
      async (url: string): Promise<apiResponseType> => {
         return runRequest('GET', url);
      },
      [runRequest]
   );

   const post = useCallback(
      async (url: string, body: unknown): Promise<apiResponseType> => {
         return runRequest('POST', url, JSON.stringify(body));
      },
      [runRequest]
   );

   const put = useCallback(
      async (url: string, body: unknown): Promise<apiResponseType> => {
         return runRequest('PUT', url, JSON.stringify(body));
      },
      [runRequest]
   );

   const get_token = useCallback(
      async (email: string, password: string): Promise<apiTokenType> => {
         const creds = new URLSearchParams({
            username: email,
            password,
            grant_type: 'password',
         });
         const resp = await runRequest('POST', '/api/oauth2/token/', creds, { 'Content-Type': 'application/x-www-form-urlencoded' });
         if (!resp.success) {
            throw new Error(resp.errmsg);
         }
         if (!isApiTokenType(resp.data)) {
            throw new Error('Token data corrupt or missing in response');
         }
         setAccessToken(resp.data.access_token);
         setRefreshToken(resp.data.refresh_token);
         return resp.data;
      },
      [runRequest, setAccessToken, setRefreshToken]
   );

   return { isLoading, get, post, put, get_token };
};
