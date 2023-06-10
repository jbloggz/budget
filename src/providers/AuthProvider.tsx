/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * AuthProvider.tsx: This file contains the authentication context/provider for the app
 */

import { PropsWithChildren, createContext, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authContextType, credentialsType } from './context.types';
import { Login } from '../pages';

export const AuthContext = createContext<authContextType>({
   login: () => false,
   logout: () => undefined,
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
   const navigate = useNavigate();
   const [loggedIn, setLoggedIn] = useState(false);
   const login = useCallback((creds: credentialsType) => {
      return new Promise((r) => setTimeout(r, 2000)).then(() => {
         if (creds.email === 'foo@foo.com' && creds.password === 'bar') {
            setLoggedIn(true);
            return true;
         } else {
            return false;
         }
      });
   }, []);
   const logout = useCallback(() => {
      setLoggedIn(false);
      navigate('/');
   }, [navigate]);

   return <AuthContext.Provider value={{ login, logout }}>{loggedIn ? children : <Login />}</AuthContext.Provider>;
};
