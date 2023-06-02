/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * main.tsx: This file is the main entry point for react
 */

import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import App from './App.tsx';
import theme from './theme/index.ts';

export const Main = () => {
   const [colorScheme, setColorScheme] = useState('teal');

   const currentTheme = theme(colorScheme);
   return (
      <React.StrictMode>
         <ChakraProvider theme={currentTheme}>
            <ColorModeScript initialColorMode={currentTheme.config.initialColorMode} />
            <App setColorScheme={setColorScheme} />
         </ChakraProvider>
      </React.StrictMode>
   );
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<Main />);
