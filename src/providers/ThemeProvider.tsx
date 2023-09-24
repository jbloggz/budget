/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * ThemeProvider.tsx: This file contains the theme context/provider for the app
 */

import { Dispatch, PropsWithChildren, SetStateAction, useCallback } from 'react';
import { useColorMode } from '@chakra-ui/react';
import { Theme } from '../app.types';
import { createContext } from '.';

export const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void }>();

interface ThemeProviderProps {
   theme: Theme;
   setTheme: Dispatch<SetStateAction<Theme>>;
}

export const ThemeProvider = ({ theme, setTheme, children }: PropsWithChildren<ThemeProviderProps>) => {
   const { setColorMode } = useColorMode();

   const setAppTheme = useCallback(
      (newTheme: Theme) => {
         setTheme(newTheme);
         setColorMode(newTheme == 'dark' ? 'dark' : 'light');
      },
      [setColorMode, setTheme]
   );

   return <ThemeContext.Provider value={{ theme, setTheme: setAppTheme }}>{children}</ThemeContext.Provider>;
};
