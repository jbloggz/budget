/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * ThemeProvider.tsx: This file contains the theme context/provider for the app
 */

import { Dispatch, PropsWithChildren, SetStateAction, useCallback } from 'react';
import { useColorMode } from '@chakra-ui/react';
import { themeType } from '../theme';
import { createContext, themeContextType } from '.';

export const ThemeContext = createContext<themeContextType>();

interface ThemeProviderProps {
   theme: themeType;
   setTheme: Dispatch<SetStateAction<themeType>>;
}

export const ThemeProvider = ({ theme, setTheme, children }: PropsWithChildren<ThemeProviderProps>) => {
   const { setColorMode } = useColorMode();

   const setAppTheme = useCallback(
      (newTheme: themeType) => {
         setTheme(newTheme);
         setColorMode(newTheme == 'dark' ? 'dark' : 'light');
      },
      [setColorMode, setTheme]
   );

   return <ThemeContext.Provider value={{ theme, setTheme: setAppTheme }}>{children}</ThemeContext.Provider>;
};
