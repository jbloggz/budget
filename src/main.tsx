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
import App from './components/App';
import { themeConfig, themeType, ThemeProvider } from './theme';
import { useLocalStorage } from 'react-use';

export const ThemedApp = () => {
   const [theme, setTheme] = useLocalStorage<themeType>('theme', 'light');
   return (
      <ChakraProvider theme={themeConfig(theme)}>
         <ThemeProvider theme={theme} setTheme={setTheme}>
            <App />
         </ThemeProvider>
      </ChakraProvider>
   );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
   <React.StrictMode>
      <ThemedApp />
   </React.StrictMode>
);
