/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * AuthProvider.tsx: This file contains the authentication context/provider for the app
 */

import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';
import { authContextType, credentialsType } from './context.types';
import { Login } from '../pages';
import { createContext } from '.';
import { useAPI } from '../hooks';

export const AuthContext = createContext<authContextType>();

export const AuthProvider = ({ children }: PropsWithChildren) => {
   const navigate = useNavigate();
   const [loggedInState, setLoggedInState] = useState('initialising');
   const { getToken, get, clearToken } = useAPI();

   const login = useCallback(
      async (creds: credentialsType) => {
         try {
            await getToken(creds.email, creds.password, creds.remember);
            setLoggedInState('loggedIn');
            return { success: true, status: 200 };
         } catch (err) {
            setLoggedInState('loggedOut');
            return { success: false, errmsg: err instanceof Error ? err.message : String(err), status: 401 };
         }
      },
      [getToken]
   );

   const logout = useCallback(() => {
      setLoggedInState('loggedOut');
      clearToken();
      navigate('/');
   }, [navigate, clearToken]);

   useEffect(() => {
      const run = async () => {
         const resp = await get('/api/oauth2/token/');
         if (resp.success) {
            setLoggedInState('loggedIn');
         } else {
            setLoggedInState('loggedOut');
         }
      };
      if (loggedInState === 'initialising') {
         setLoggedInState('checking');
         run();
      }
   }, [get, loggedInState]);

   return (
      <AuthContext.Provider value={{ login, logout }}>
         {loggedInState === 'loggedIn' ? (
            children
         ) : loggedInState === 'loggedOut' ? (
            <Login />
         ) : (
            <Center h="100vh">
               <Spinner />
            </Center>
         )}
      </AuthContext.Provider>
   );
};
