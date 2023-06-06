/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * main.tsx: This file is the main entry point for react
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { useLocalStorage } from 'react-use';
import { App } from './components';
import { themeConfig, themeType } from './theme';
import { ThemeProvider, AuthProvider } from './providers';

export const ThemedApp = () => {
   const [theme, setTheme] = useLocalStorage<themeType>('theme', 'light');
   return (
      <ChakraProvider theme={themeConfig(theme)}>
         <ThemeProvider theme={theme} setTheme={setTheme}>
            <AuthProvider>
               <App />
            </AuthProvider>
         </ThemeProvider>
      </ChakraProvider>
   );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
   <React.StrictMode>
      <ThemedApp />
   </React.StrictMode>
);
