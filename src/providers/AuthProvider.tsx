/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * AuthProvider.tsx: This file contains the authentication context/provider for the app
 */

import { PropsWithChildren, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authContextType, credentialsType } from './context.types';
import { Login } from '../pages';
import { createContext } from '.';
import { useAPI } from '../hooks';

export const AuthContext = createContext<authContextType>();

export const AuthProvider = ({ children }: PropsWithChildren) => {
   const navigate = useNavigate();
   const [loggedIn, setLoggedIn] = useState(false);
   const api = useAPI();

   const login = useCallback(
      async (creds: credentialsType) => {
         try {
            await api.get_token(creds.email, creds.password);
            setLoggedIn(true);
            return { success: true };
         } catch (err) {
            setLoggedIn(false);
            return { success: false, errmsg: err instanceof Error ? err.message : String(err) };
         }
      },
      [api]
   );

   const logout = useCallback(() => {
      setLoggedIn(false);
      navigate('/');
   }, [navigate]);

   return <AuthContext.Provider value={{ login, logout }}>{loggedIn ? children : <Login />}</AuthContext.Provider>;
};
