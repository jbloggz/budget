/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * RouterError.tsx: This file contains the page that is displayed for react router errors
 */

import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Flex, Box, Heading, Text } from '@chakra-ui/react';

const RouterError = () => {
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
   );
};

export default RouterError;
