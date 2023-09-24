/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * ErrorPage.tsx: This file contains the page that is displayed for any errors encountered
 */

import { useLocalStorage } from 'react-use';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Flex, Box, Heading, Text, ChakraProvider } from '@chakra-ui/react';
import { themeConfig } from '../theme';
import { ThemeProvider } from '../providers';
import { Theme } from '../app.types';

const ErrorPage = () => {
   const [theme, setTheme] = useLocalStorage<Theme>('theme', 'light');
   const error = useRouteError();
   let status, msg;
   if (isRouteErrorResponse(error)) {
      status = error.status;
      msg = error.statusText;
   } else if (error instanceof Error) {
      status = 'Unknown';
      msg = 'Unexpected Error';
   }

   return (
      <ChakraProvider theme={themeConfig(theme)}>
         <ThemeProvider theme={theme} setTheme={setTheme}>
            <Flex height="100vh" alignItems="center" justifyContent="center">
               <Box textAlign="center">
                  <Heading as="h1" size="2xl" mb={4}>
                     {status} {msg}
                  </Heading>
                  <Text fontSize="xl" color="gray.600">
                     Oops! Something has gone wrong.
                  </Text>
               </Box>
            </Flex>
         </ThemeProvider>
      </ChakraProvider>
   );
};

export default ErrorPage;
