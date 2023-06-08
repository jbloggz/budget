/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Login.tsx: This file contains the login page component
 */

import { useContext, useRef, useState } from 'react';
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
   Spinner,
   FormErrorMessage,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { AuthContext, authContextType } from '../providers';

/* An interface for the login credentials */
interface credentialsType {
   email: string;
   password: string;
   remember: boolean;
}

const Login = () => {
   const { login } = useContext<authContextType>(AuthContext);
   const [invalidEmail, setInvalidEmail] = useState<boolean>(false);
   const [invalidPassword, setInvalidPassword] = useState<boolean>(false);
   const [authError, setAuthError] = useState<string>('');
   const passwordReveal = useDisclosure();
   const styles = useMultiStyleConfig('Login');
   const submit = useDisclosure();

   const form = useRef(null);
   const validate_form = (): credentialsType | null => {
      if (form.current === null) {
         return null;
      }
      let error = false;
      const creds: credentialsType = {
         email: form.current['email']['value'],
         password: form.current['password']['value'],
         remember: form.current['remember']['checked'],
      };
      if (creds.email === '') {
         setInvalidEmail(true);
         error = true;
      }
      if (creds.password === '') {
         setInvalidPassword(true);
         error = true;
      }

      if (error) {
         return null;
      }

      return creds;
   };

   const authenticate = () => {
      setAuthError('');
      const creds = validate_form();
      if (creds === null) {
         return;
      }
      setTimeout(() => {
         if (creds.email === 'foo@foo.com' && creds.password === 'bar') {
            login();
         } else {
            setAuthError('Invalid username/password');
         }
         submit.onClose();
      }, 2000);
      submit.onOpen();
   };

   return (
      <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '4', sm: '8' }}>
         <Stack spacing="8">
            <Center>
               <Image src="/favicon.ico" height="8" pr={2} />
               <Heading size="lg">Budget Login</Heading>
            </Center>
            <Box __css={styles.card} py="8" px="10" boxShadow="md" borderRadius="xl">
               <form ref={form}>
                  <Stack spacing="6">
                     <Stack spacing="5">
                        <FormControl isInvalid={invalidEmail}>
                           <FormLabel htmlFor="email">Email</FormLabel>
                           <Input name="email" type="email" onChange={() => setInvalidEmail(false)} isDisabled={submit.isOpen} required />
                           <FormErrorMessage>Please enter an email address</FormErrorMessage>
                        </FormControl>
                        <FormControl isInvalid={invalidPassword}>
                           <FormLabel htmlFor="password">Password</FormLabel>
                           <InputGroup>
                              <Input
                                 name="password"
                                 isDisabled={submit.isOpen}
                                 type={passwordReveal.isOpen ? 'text' : 'password'}
                                 autoComplete="current-password"
                                 onChange={() => setInvalidPassword(false)}
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
                     <Checkbox name="remember" value="checked" defaultChecked isDisabled={submit.isOpen}>
                        Remember me
                     </Checkbox>
                     <Button type="submit" onClick={authenticate} isDisabled={submit.isOpen}>
                        {submit.isOpen ? <Spinner /> : 'Sign in'}
                     </Button>
                     <FormControl isInvalid={authError !== ''}>
                        <FormErrorMessage>{authError}</FormErrorMessage>
                     </FormControl>
                  </Stack>
               </form>
            </Box>
         </Stack>
      </Container>
   );
};

export default Login;
