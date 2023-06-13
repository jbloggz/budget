/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * TopBar.tsx: This file contains the top bar component
 */

import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
   Avatar,
   Box,
   Button,
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
   Menu,
   MenuButton,
   MenuItem,
   MenuList,
   Show,
   useDisclosure,
   useStyleConfig,
} from '@chakra-ui/react';
import { ChevronDownIcon, HamburgerIcon } from '@chakra-ui/icons';
import { NavList } from '.';
import { AuthContext, authContextType, useContext } from '../providers';

const TopBar = () => {
   const { isOpen, onOpen, onClose } = useDisclosure();
   const styles = useStyleConfig('TopBar');
   const { logout } = useContext<authContextType>(AuthContext);

   /* Close the drawer any time the location changes */
   const location = useLocation();
   useEffect(() => {
      onClose();
   }, [location, onClose]);

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
               <Menu>
                  <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                     <Avatar name="Joe" size="sm" />
                  </MenuButton>
                  <MenuList>
                     <MenuItem aria-label="Settings" as={Link} to="settings">Settings</MenuItem>
                     <MenuItem aria-label="Logout" onClick={logout}>Logout</MenuItem>
                  </MenuList>
               </Menu>
            </Flex>
         </Flex>
      </Box>
   );
};

export default TopBar;
