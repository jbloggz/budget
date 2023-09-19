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
import { authContextType, credentialsType } from './context.types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Login } from '../pages';
import { createContext } from '.';
import { useAPI } from '../hooks';

export const AuthContext = createContext<authContextType>();

export const AuthProvider = ({ children }: PropsWithChildren) => {
   const navigate = useNavigate();
   const api = useAPI();
   const loginQuery = useMutation({
      mutationFn: useCallback((creds: credentialsType) => api.login(creds.email, creds.password, creds.remember), [api]),
   });
   const tokenCheckQuery = useQuery({
      queryKey: ['tokenCheck'],
      queryFn: useCallback(() => api.request({ method: 'GET', url: '/api/oauth2/token/' }), [api]),
      staleTime: Infinity,
      cacheTime: Infinity,
      retry: 0,
      enabled: api.tokenData().exp > 0,
   });
   const login = async (creds: credentialsType) => loginQuery.mutateAsync(creds);
   const logout = useCallback(() => {
      api.logout();
      navigate('/');
      window.location.reload();
   }, [navigate, api]);

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
