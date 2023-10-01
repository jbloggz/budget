/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * AuthProvider.tsx: This file contains the authentication context/provider for the app
 */

import { PropsWithChildren, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';
import { Login } from '../pages';
import { createContext } from '.';
import { useAPI } from '../hooks';
import { APIAuthTokens, APIResponse, LoginCredentials } from '../app.types';

export const AuthContext = createContext<{ login: (creds: LoginCredentials) => Promise<APIResponse<APIAuthTokens>>; logout: () => void }>();

export const AuthProvider = ({ children }: PropsWithChildren) => {
   const navigate = useNavigate();
   const api = useAPI();
   const loginQuery = api.useMutation(useCallback((creds: LoginCredentials) => api.login(creds.email, creds.password, creds.remember), [api]));
   const logoutQuery = api.useMutation(useCallback(() => api.logout(), [api]));
   const tokenCheckQuery = api.useQuery(
      {
         method: 'GET',
         url: '/api/oauth2/token/',
      },
      {
         staleTime: Infinity,
         cacheTime: Infinity,
         retry: 0,
         enabled: api.expiry > 0,
      }
   );
   const login = async (creds: LoginCredentials) => loginQuery.mutateAsync(creds);
   const logout = useCallback(() => {
      logoutQuery.mutateAsync();
      navigate('/');
      window.location.reload();
   }, [navigate, logoutQuery]);

   return (
      <AuthContext.Provider value={{ login, logout }}>
         {loginQuery.isSuccess || tokenCheckQuery.isSuccess ? (
            children
         ) : tokenCheckQuery.isFetching ? (
            <Center h="100vh">
               <Spinner />
            </Center>
         ) : (
            <Login isLoading={loginQuery.isLoading} />
         )}
      </AuthContext.Provider>
   );
};
