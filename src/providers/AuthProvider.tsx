/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * AuthProvider.tsx: This file contains the authentication context/provider for the app
 */

import { PropsWithChildren, useCallback } from 'react';
import { Center, Spinner } from '@chakra-ui/react';
import { Login } from '../pages';
import { createContext } from '.';
import { useAPI } from '../hooks';
import { APIAuthTokens, APIResponse, LoginCredentials } from '../app.types';

export const AuthContext = createContext<{ login: (creds: LoginCredentials) => Promise<APIResponse<APIAuthTokens>>; logout: () => void }>();

export const AuthProvider = ({ children }: PropsWithChildren) => {
   const api = useAPI();
   const loginQuery = api.useMutationFn(useCallback((creds: LoginCredentials) => api.login(creds.email, creds.password, creds.remember), [api]));
   const logoutQuery = api.useMutationFn(
      useCallback(() => api.logout(), [api]),
      { onSettled: () => window.location.replace('/') }
   );
   const tokenCheckQuery = api.useQuery({
      method: 'GET',
      url: '/api/oauth2/token/',
      runOnce: true,
      enabled: api.expiry > 0,
   });

   return (
      <AuthContext.Provider value={{ login: loginQuery.mutateAsync, logout: logoutQuery.mutate }}>
         {tokenCheckQuery.isFetching || logoutQuery.isLoading || logoutQuery.isSuccess ? (
            <Center h="100vh">
               <Spinner />
            </Center>
         ) : loginQuery.isSuccess || tokenCheckQuery.isSuccess ? (
            children
         ) : (
            <Login isLoading={loginQuery.isLoading} />
         )}
      </AuthContext.Provider>
   );
};
