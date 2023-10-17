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
import { Mutex } from 'async-mutex';
import { APIResponse, APIRequest, APIAuthTokens, isAPIAuthTokens, QueryOptions } from '../app.types';
import { UseMutationOptions, UseQueryOptions, useQuery as useReactQuery, useMutation as useReactMutation } from '@tanstack/react-query';

/* Mutex for token requests */
const mutex = new Mutex();

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

const decode_token = (token: string | undefined | null): TokenData => {
   try {
      if (token) {
         return jwt_decode<TokenData>(token);
      }
   } catch (e) {
      /* Ignore */
   }
   return { sub: '', iat: 0, exp: 0 };
};

export const useAPI = () => {
   const opts = { serializer: { stringify: String, parse: String } };
   const [accessTokenLS, setAccessTokenLS, { removeItem: removeAccessTokenLS }] = useLocalStorageState<string>('access_token', opts);
   const [refreshTokenLS, setRefreshTokenLS, { removeItem: removeRefreshTokenLS }] = useLocalStorageState<string>('refresh_token', opts);
   const [accessTokenSS, setAccessTokenSS, { removeItem: removeAccessTokenSS }] = useSessionStorageState<string>('access_token', opts);
   const [refreshTokenSS, setRefreshTokenSS, { removeItem: removeRefreshTokenSS }] = useSessionStorageState<string>('refresh_token', opts);
   const accessToken = accessTokenLS || accessTokenSS;
   const refreshToken = refreshTokenLS || refreshTokenSS;
   const [tokenData, setTokenData] = useState<TokenData>({ sub: '', iat: 0, exp: 0 });

   /* Update the token data whenever the accessToken changes */
   useEffect(() => {
      setTokenData(decode_token(accessToken));
   }, [accessToken]);

   const runRawRequest = useCallback(
      async <T>(options: APIRequest<T>): Promise<APIResponse<T>> => {
         let code = -1;
         try {
            let url = options.url;
            if (options.params) {
               url += '?' + options.params.toString();
            }
            const resp = await fetch(url, { method: options.method, headers: options.headers, body: options.body });
            code = resp.status;
            let data;
            if (code == 204 && options.url === '/api/oauth2/logout/') {
               /* Successfully logged out */
               data = undefined;
            } else if (code == 204 && options.url === '/api/oauth2/token/') {
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

   const clear_tokens = useCallback(() => {
      removeAccessTokenLS();
      removeRefreshTokenLS();
      removeAccessTokenSS();
      removeRefreshTokenSS();
   }, [removeAccessTokenLS, removeRefreshTokenLS, removeAccessTokenSS, removeRefreshTokenSS]);

   const runTokenRequest = useCallback(
      async (creds: URLSearchParams): Promise<APIResponse<APIAuthTokens>> => {
         const resp = await mutex.runExclusive(async () => {
            /*
             * Check if the current local/session token is valid before trying
             * to get a new one. Another token request may have already got a new
             * token, so don't get another one
             */
            const current_access_token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
            const current_refresh_token = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
            const accessTokenData = decode_token(current_access_token);
            clear_tokens();
            const resp =
               accessTokenData.exp > Date.now() / 1000
                  ? await Promise.resolve({
                       code: 200,
                       data: { access_token: current_access_token, refresh_token: current_refresh_token, token_type: 'bearer' },
                    } as APIResponse<APIAuthTokens>)
                  : await runRawRequest<APIAuthTokens>({
                       method: 'POST',
                       url: '/api/oauth2/token/',
                       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                       body: creds.toString(),
                       validate: isAPIAuthTokens,
                    });

            if (creds.get('remember') === 'true') {
               setAccessTokenLS(resp.data.access_token);
               setRefreshTokenLS(resp.data.refresh_token);
            } else {
               setAccessTokenSS(resp.data.access_token);
               setRefreshTokenSS(resp.data.refresh_token);
            }

            return resp;
         });

         return resp;
      },
      [runRawRequest, setAccessTokenLS, setAccessTokenSS, setRefreshTokenSS, setRefreshTokenLS, clear_tokens]
   );

   const login = useCallback(
      async (user: string, password: string, remember: boolean) => {
         return await runTokenRequest(
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

   const logout = useCallback(async () => {
      let resp = Promise.resolve({ code: 204 } as APIResponse<void>);
      if (refreshToken) {
         resp = runRawRequest<void>({
            method: 'POST',
            url: '/api/oauth2/logout/',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
               refresh_token: refreshToken,
               grant_type: 'refresh_token',
            }).toString(),
         });
      }
      await resp;
      clear_tokens();
      return resp;
   }, [clear_tokens, runRawRequest, refreshToken]);

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
               options.headers.Authorization = `Bearer ${tokResp.data.access_token}`;
               return await runRawRequest<T>(options);
            }

            /* Rethrow */
            throw error;
         }
      },
      [runRawRequest, runTokenRequest, refreshToken, accessToken, accessTokenLS]
   );

   const useQuery = <T>(opts: APIRequest<T> & QueryOptions<T>) => {
      const queryKey = [opts.method, opts.url];
      if (opts.params) {
         for (const [key, value] of opts.params) {
            queryKey.push(key);
            queryKey.push(value);
         }
      }

      const { enabled, runOnce, onSuccess, ...apiOpts } = opts;
      const queryOpts: UseQueryOptions<APIResponse<T>, APIError> = {
         queryKey,
         enabled,
         queryFn: async () => {
            const resp = await request<T>(apiOpts);
            if (onSuccess) {
               onSuccess(resp.data);
            }
            return resp;
         },
      };
      if (runOnce) {
         queryOpts.staleTime = Infinity;
         queryOpts.cacheTime = Infinity;
         queryOpts.retry = 0;
      }
      const query = useReactQuery<APIResponse<T>, APIError>(queryOpts);

      return query;
   };

   const useMutationFn = <TInput = void, TOutput = void>(
      fn: (data: TInput) => Promise<APIResponse<TOutput>>,
      mutationOpts?: UseMutationOptions<APIResponse<TOutput>, APIError, TInput>
   ) => {
      return useReactMutation<APIResponse<TOutput>, APIError, TInput>({
         mutationFn: fn,
         ...mutationOpts,
      });
   };

   const useMutationQuery = <TInput = void, TOutput = void>(opts: APIRequest<TOutput> & QueryOptions<TOutput>) => {
      const { onSuccess, ...apiOpts } = opts;
      return useMutationFn(
         useCallback(
            (data: TInput) => {
               const body = data ? JSON.stringify(data) : undefined;
               return request<TOutput>({ ...apiOpts, body });
            },
            [apiOpts]
         ),
         { ...(onSuccess && { onSuccess: (resp: APIResponse<TOutput>) => onSuccess(resp.data) }) }
      );
   };

   return { request, login, logout, useQuery, useMutationFn, useMutationQuery, user: tokenData.sub, expiry: tokenData.exp };
};
