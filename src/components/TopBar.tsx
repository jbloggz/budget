/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * TopBar.tsx: This file contains the top bar component
 */

import { HamburgerIcon } from '@chakra-ui/icons';
import {
   Avatar,
   Box,
   Center,
   Drawer,
   DrawerBody,
   DrawerContent,
   DrawerHeader,
   DrawerOverlay,
   Flex,
   Heading,
   Hide,
   IconButton,
   Image,
   Show,
   useDisclosure,
   useStyleConfig,
} from '@chakra-ui/react';
import { NavList } from './NavList';

export const TopBar = () => {
   const { isOpen, onOpen, onClose } = useDisclosure();
   const styles = useStyleConfig('TopBar');

   return (
      <Box as="header" __css={styles} p="2">
         <Flex>
            <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
               <DrawerOverlay />
               <DrawerContent>
                  <DrawerHeader></DrawerHeader>
                  <DrawerBody p="0" as="header">
                     <NavList />
                  </DrawerBody>
               </DrawerContent>
            </Drawer>
            <Flex flex="1" justify="left" alignItems="center">
               <Hide above="xl">
                  <Show above="md">
                     <IconButton aria-label="Navigation" icon={<HamburgerIcon />} onClick={onOpen} />
                  </Show>
               </Hide>
            </Flex>
            <Center flex="1" gap="2">
               <Image src="/favicon.ico" height="8" />
               <Heading as="h1" size="md">
                  Budget
               </Heading>
            </Center>
            <Flex flex="1" justify="right" alignItems="center">
               <Avatar name="Joe" size="sm" />
            </Flex>
         </Flex>
      </Box>
   );
};
