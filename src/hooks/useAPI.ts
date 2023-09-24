/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * useAPI.ts: This file contains the useAPI custom hook
 */

import { useCallback, useEffect, useState } from 'react';
import jwt_decode from 'jwt-decode';
import useLocalStorageState from 'use-local-storage-state';
import useSessionStorageState from 'use-session-storage-state';
import { APIResponse, APIRequest, APIAuthTokens, isAPIAuthTokens } from '../app.types';

interface TokenData {
   sub: string;
   iat: number;
   exp: number;
}

export class APIError extends Error {
   code: number;

   constructor(errmsg: string, code: number) {
      super(errmsg);
      this.name = 'APIError';
      this.code = code;
   }
}

export const useAPI = () => {
   const opts = { serializer: { stringify: String, parse: String } };
   const [accessTokenLS, setAccessTokenLS, { removeItem: removeAccessTokenLS }] = useLocalStorageState<string>('access_token', opts);
   const [refreshTokenLS, setRefreshTokenLS, { removeItem: removeRefreshTokenLS }] = useLocalStorageState<string>('refresh_token', opts);
   const [accessTokenSS, setAccessTokenSS, { removeItem: removeAccessTokenSS }] = useSessionStorageState<string>('access_token', opts);
   const [refreshTokenSS, setRefreshTokenSS, { removeItem: removeRefreshTokenSS }] = useSessionStorageState<string>('refresh_token', opts);

   const [accessToken, setAccessToken] = useState<string | undefined>(accessTokenLS || accessTokenSS);
   const [refreshToken, setRefreshToken] = useState<string | undefined>(refreshTokenLS || refreshTokenSS);

   const [tokenData, setTokenData] = useState<TokenData>({ sub: '', iat: 0, exp: 0 });

   useEffect(() => {
      if (accessToken) {
         try {
            const decoded = jwt_decode<TokenData>(accessToken);
            setTokenData(decoded);
            return;
         } catch (e) {
            /* Ignore */
         }
      }

      setTokenData({ sub: '', iat: 0, exp: 0 });
   }, [accessToken]);

   const runRawRequest = useCallback(
      async <T>(options: APIRequest<T>): Promise<APIResponse<T>> => {
         let code = -1;
         try {
            const resp = await fetch(options.url, { method: options.method, headers: options.headers, body: options.body });
            code = resp.status;
            let data;
            if (code == 204 && options.url === '/api/oauth2/token/') {
               /* Successfully validated credentials */
               data = {
                  access_token: accessToken || '',
                  refresh_token: refreshToken || '',
                  token_type: 'bearer',
               };
            } else {
               data = await resp.json();
               if (!resp.ok) {
                  throw new APIError(data.detail, code);
               }
            }

            if (options.validate && !options.validate(data)) {
               throw new APIError('Response validation failed', code);
            }
            if (code >= 400) {
               throw new APIError(resp.statusText, code);
            }
            return { data: data as T, code };
         } catch (error) {
            throw new APIError(error instanceof Error ? error.message : String(error), code);
         }
      },
      [accessToken, refreshToken]
   );

   const logout = useCallback(() => {
      setAccessToken(undefined);
      setRefreshToken(undefined);
      removeAccessTokenLS();
      removeRefreshTokenLS();
      removeAccessTokenSS();
      removeRefreshTokenSS();
   }, [removeAccessTokenLS, removeRefreshTokenLS, removeAccessTokenSS, removeRefreshTokenSS, setAccessToken, setRefreshToken]);

   const runTokenRequest = useCallback(
      async (creds: URLSearchParams): Promise<APIAuthTokens> => {
         logout();
         const resp = await runRawRequest<APIAuthTokens>({
            method: 'POST',
            url: '/api/oauth2/token/',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: creds,
            validate: isAPIAuthTokens,
         });
         setAccessToken(resp.data.access_token);
         setRefreshToken(resp.data.refresh_token);
         if (creds.get('remember') === 'true') {
            setAccessTokenLS(resp.data.access_token);
            setRefreshTokenLS(resp.data.refresh_token);
         } else {
            setAccessTokenSS(resp.data.access_token);
            setRefreshTokenSS(resp.data.refresh_token);
         }

         return resp.data;
      },
      [runRawRequest, setAccessTokenLS, setAccessTokenSS, setRefreshTokenSS, setRefreshTokenLS, logout, setAccessToken, setRefreshToken]
   );

   const login = useCallback(
      async (user: string, password: string, remember: boolean) => {
         await runTokenRequest(
            new URLSearchParams({
               username: user,
               password,
               remember: remember ? 'true' : 'false',
               grant_type: 'password',
            })
         );
      },
      [runTokenRequest]
   );

   const request = useCallback(
      async <T>(options: APIRequest<T>): Promise<APIResponse<T>> => {
         if (!accessToken) {
            throw new APIError('Missing access token', 401);
         }
         if (!options.headers) {
            options.headers = {
               Authorization: `Bearer ${accessToken}`,
            };
            if (options.method !== 'GET') {
               options.headers['Content-Type'] = 'application/json';
            }
         }
         try {
            return await runRawRequest<T>(options);
         } catch (error) {
            if (error instanceof APIError && error.code === 401 && refreshToken) {
               /* Attempt a token refresh */
               const tokResp = await runTokenRequest(
                  new URLSearchParams({
                     refresh_token: refreshToken,
                     remember: accessTokenLS ? 'true' : 'false',
                     grant_type: 'refresh_token',
                  })
               );

               /* Re-run the query with the new token */
               options.headers.Authorization = `Bearer ${tokResp.access_token}`;
               return await runRawRequest<T>(options);
            }

            /* Rethrow */
            throw error;
         }
      },
      [runRawRequest, runTokenRequest, refreshToken, accessToken, accessTokenLS]
   );

   return { request, login, logout, user: tokenData.sub, expiry: tokenData.exp };
};
