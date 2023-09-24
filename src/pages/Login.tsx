/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Login.tsx: This file contains the login page component
 */

import { FormEvent, useRef } from 'react';
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
   FormErrorMessage,
   useToast,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { AuthContext, useContext } from '../providers';
import { APIError } from '../hooks';
import { LoginCredentials, isNonEmptyString } from '../app.types';

const Login = ({ isLoading }: { isLoading: boolean }) => {
   const toast = useToast();
   const { login } = useContext(AuthContext);
   const passwordReveal = useDisclosure();
   const styles = useMultiStyleConfig('Login');

   const form = useRef(null);
   const validateForm = (): LoginCredentials | null => {
      if (form.current === null) {
         return null;
      }
      const data = new FormData(form.current);
      const email = data.get('email');
      const password = data.get('password');
      const remember = data.get('remember') === 'checked';
      if (isNonEmptyString(email) && isNonEmptyString(password)) {
         return { email, password, remember };
      } else {
         return null;
      }
   };

   const submitForm = async (event: FormEvent) => {
      event.preventDefault();
      const creds = validateForm();
      if (creds === null) {
         return;
      }
      try {
         await login(creds);
      } catch (err) {
         toast({
            title: 'Error',
            description: err instanceof APIError ? err.message : 'Unknown error',
            status: 'error',
            duration: 5000,
         });
      }
   };

   return (
      <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '4', sm: '8' }}>
         <Stack spacing="8">
            <Center>
               <Image src="/favicon.ico" height="8" pr={2} />
               <Heading size="lg">Budget Login</Heading>
            </Center>
            <Box __css={styles.card} py="8" px="10" boxShadow="md" borderRadius="xl">
               <form ref={form} onSubmit={submitForm}>
                  <Stack spacing="6">
                     <Stack spacing="5">
                        <FormControl>
                           <FormLabel htmlFor="email">Email</FormLabel>
                           <Input id="email" name="email" type="email" isDisabled={isLoading} required />
                           <FormErrorMessage>Please enter an email address</FormErrorMessage>
                        </FormControl>
                        <FormControl>
                           <FormLabel htmlFor="password">Password</FormLabel>
                           <InputGroup>
                              <Input
                                 id="password"
                                 name="password"
                                 isDisabled={isLoading}
                                 type={passwordReveal.isOpen ? 'text' : 'password'}
                                 autoComplete="current-password"
                                 required
                              />
                              <InputRightElement>
                                 <IconButton
                                    variant="link"
                                    aria-label={passwordReveal.isOpen ? 'Mask password' : 'Reveal password'}
                                    icon={passwordReveal.isOpen ? <ViewOffIcon /> : <ViewIcon />}
                                    onClick={passwordReveal.onToggle}
                                    tabIndex={-1}
                                 />
                              </InputRightElement>
                           </InputGroup>
                           <FormErrorMessage>Please enter a password</FormErrorMessage>
                        </FormControl>
                     </Stack>
                     <Checkbox name="remember" value="checked" defaultChecked isDisabled={isLoading}>
                        Remember me
                     </Checkbox>
                     <Button type="submit" isLoading={isLoading} isDisabled={isLoading}>
                        Sign in
                     </Button>
                  </Stack>
               </form>
            </Box>
         </Stack>
      </Container>
   );
};

export default Login;
