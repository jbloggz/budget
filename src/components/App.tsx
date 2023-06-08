/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * App.tsx: This file contains the top level App component
 */

import { Outlet } from 'react-router-dom';
import { useLocalStorage } from 'react-use';
import { Box, Container, Flex, Show } from '@chakra-ui/react';
import { ChakraProvider } from '@chakra-ui/react';
import { themeConfig, themeType } from '../theme';
import { ThemeProvider, AuthProvider } from '../providers';
import { TopBar, SideBar, BottomNav } from '.';

export const App = () => {
   const [theme, setTheme] = useLocalStorage<themeType>('theme', 'light');
   return (
      <ChakraProvider theme={themeConfig(theme)}>
         <ThemeProvider theme={theme} setTheme={setTheme}>
            <AuthProvider>
               <Flex direction="column" minHeight="100vh">
                  <TopBar />
                  <Flex flex="1">
                     <Show above="xl">
                        <SideBar />
                     </Show>
                     <Box w="100%" overflowY="auto" height="calc(100vh - 100px)">
                        <Container as="main" paddingY="4">
                           <Outlet />
                        </Container>
                     </Box>
                  </Flex>
                  <Show below="md">
                     <BottomNav />
                  </Show>
               </Flex>
            </AuthProvider>
         </ThemeProvider>
      </ChakraProvider>
   );
};

export default App;
