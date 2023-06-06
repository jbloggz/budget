/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Login.tsx: This file contains the login page component
 */

import { useContext } from 'react';
import {
   Box,
   Button,
   Center,
   Checkbox,
   Container,
   FormControl,
   FormLabel,
   Heading,
   Image,
   Input,
   Stack,
   IconButton,
   InputGroup,
   InputRightElement,
   useDisclosure,
   useMultiStyleConfig,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { AuthContext, authContextType } from '../providers';

const Login = () => {
   const { login } = useContext<authContextType>(AuthContext);
   const { isOpen, onToggle } = useDisclosure();
   const styles = useMultiStyleConfig('Login');

   const authenticate = () => {
      login();
   };

   return (
      <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '4', sm: '8' }}>
         <Stack spacing="8">
            <Center>
               <Image src="/favicon.ico" height="8" pr={2} />
               <Heading size="lg">Budget Login</Heading>
            </Center>
            <Box __css={styles.card} py="8" px="10" boxShadow="md" borderRadius="xl">
               <Stack spacing="6">
                  <Stack spacing="5">
                     <FormControl>
                        <FormLabel htmlFor="email">Email</FormLabel>
                        <Input name="email" type="email" />
                     </FormControl>
                     <FormControl>
                        <FormLabel htmlFor="password">Password</FormLabel>
                        <InputGroup>
                           <InputRightElement>
                              <IconButton
                                 variant="link"
                                 aria-label={isOpen ? 'Mask password' : 'Reveal password'}
                                 icon={isOpen ? <ViewOffIcon /> : <ViewIcon />}
                                 onClick={onToggle}
                              />
                           </InputRightElement>
                           <Input name="password" type={isOpen ? 'text' : 'password'} autoComplete="current-password" required />
                        </InputGroup>
                     </FormControl>
                  </Stack>
                  <Checkbox defaultChecked>Remember me</Checkbox>
                  <Button onClick={authenticate}>Sign in</Button>
               </Stack>
            </Box>
         </Stack>
      </Container>
   );
};

export default Login;