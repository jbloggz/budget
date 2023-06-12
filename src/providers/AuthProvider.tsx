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

export const AuthContext = createContext<authContextType>();

export const AuthProvider = ({ children }: PropsWithChildren) => {
   const navigate = useNavigate();
   const [loggedIn, setLoggedIn] = useState(false);
   const login = useCallback((creds: credentialsType) => {
      return new Promise((r) => setTimeout(r, 500)).then(() => {
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
