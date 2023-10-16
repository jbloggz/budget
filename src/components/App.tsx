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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { themeConfig } from '../theme';
import { ThemeProvider, AuthProvider } from '../providers';
import { Theme } from '../app.types';
import { TopBar, SideBar } from '.';

// The react-query client to inject into the app
const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         refetchOnWindowFocus: false
      },
   },
});

export const App = () => {
   const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light');
   return (
      <QueryClientProvider client={queryClient}>
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
         <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
   );
};

export default App;
