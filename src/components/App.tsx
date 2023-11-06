/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * App.tsx: This file contains the top level App component
 */

import { Outlet } from 'react-router-dom';
import useLocalStorageState from 'use-local-storage-state';
import { Box, Container, Flex, Show } from '@chakra-ui/react';
import { ChakraProvider } from '@chakra-ui/react';
import { APIProvider } from '@jbloggz/use-api';
import { themeConfig } from '../theme';
import { ThemeProvider, AuthProvider } from '../providers';
import { Theme } from '../app.types';
import { TopBar, SideBar } from '.';

export const App = () => {
   const [theme, setTheme] = useLocalStorageState<Theme>('theme', { serializer: { stringify: String, parse: String }, defaultValue: 'light' });
   return (
      <APIProvider>
         <ChakraProvider theme={themeConfig(theme)}>
            <ThemeProvider theme={theme} setTheme={setTheme}>
               <AuthProvider>
                  <Flex direction="column" minHeight="100vh">
                     <TopBar />
                     <Flex flex="1">
                        <Show above="xl">
                           <SideBar />
                        </Show>
                        <Box w="100%">
                           <Container as="main" maxWidth="100%" paddingX="4" paddingY="4">
                              <Outlet />
                           </Container>
                        </Box>
                     </Flex>
                  </Flex>
               </AuthProvider>
            </ThemeProvider>
         </ChakraProvider>
      </APIProvider>
   );
};

export default App;
