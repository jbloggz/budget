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
   const [loggedIn, setLoggedIn] = useState(false);
   const [tokenChecked, setTokenChecked] = useState(false);
   const { getToken, get, clearToken } = useAPI();

   const login = useCallback(
      async (creds: credentialsType) => {
         try {
            await getToken(creds.email, creds.password);
            setLoggedIn(true);
            return { success: true, status: 200 };
         } catch (err) {
            setLoggedIn(false);
            return { success: false, errmsg: err instanceof Error ? err.message : String(err), status: 401 };
         }
      },
      [getToken]
   );

   const logout = useCallback(() => {
      setLoggedIn(false);
      clearToken();
      navigate('/');
   }, [navigate, clearToken]);

   useEffect(() => {
      const run = async () => {
         const resp = await get('/api/oauth2/token/');
         if (resp.success) {
            setLoggedIn(true);
         }
         setTokenChecked(true);
      };
      if (!tokenChecked) {
         run();
      }
   }, [get, tokenChecked]);

   return (
      <AuthContext.Provider value={{ login, logout }}>
         {tokenChecked ? (
            loggedIn ? (
               children
            ) : (
               <Login />
            )
         ) : (
            <Center h="100vh">
               <Spinner />
            </Center>
         )}
      </AuthContext.Provider>
   );
};
