/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * main.tsx: This file contains the top level App component
 */

import { CalendarIcon, HamburgerIcon, MoonIcon, SettingsIcon, SunIcon, TimeIcon } from '@chakra-ui/icons';
import {
   Avatar,
   Box,
   Button,
   Center,
   Container,
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
   List,
   ListItem,
   Select,
   Show,
   useColorMode,
   useDisclosure,
   useStyleConfig,
} from '@chakra-ui/react';
import { Dispatch, SetStateAction } from 'react';

interface appProps {
   setColorScheme: Dispatch<SetStateAction<string>>;
}

const TopBar = () => {
   const { colorMode, toggleColorMode } = useColorMode();
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
               <IconButton aria-label="Navigation" icon={colorMode === 'light' ? <SunIcon /> : <MoonIcon />} onClick={toggleColorMode} />
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

const SideBar = () => {
   const styles = useStyleConfig('SideBar');
   return (
      <Box minWidth="xs" as="aside" __css={styles}>
         <NavList />
      </Box>
   );
};

const NavList = () => {
   return (
      <List>
         <ListItem>
            <Button aria-label="Allocations" justifyContent="left" pl="8" width="100%" borderRadius={0} leftIcon={<TimeIcon />}>
               Allocations
            </Button>
         </ListItem>
         <ListItem>
            <Button aria-label="Transactions" justifyContent="left" pl="8" width="100%" borderRadius={0} leftIcon={<CalendarIcon />}>
               Transactions
            </Button>
         </ListItem>
         <ListItem>
            <Button aria-label="Settings" justifyContent="left" pl="8" width="100%" borderRadius={0} leftIcon={<SettingsIcon />}>
               Settings
            </Button>
         </ListItem>
      </List>
   );
};

const BottomNav = () => {
   return (
      <Flex as="nav" justify="space-evenly">
         <IconButton aria-label="Allocations" flex="1" borderRight="1px" borderRadius={0} icon={<TimeIcon />} />
         <IconButton aria-label="Transactions" flex="1" borderX="1px" borderRadius={0} icon={<CalendarIcon />} />
         <IconButton aria-label="Settings" flex="1" borderLeft="1px" borderRadius={0} icon={<SettingsIcon />} />
      </Flex>
   );
};

const App = ({ setColorScheme }: appProps) => {
   return (
      <Flex direction="column" minHeight="100vh">
         <TopBar />
         <Flex flex="1">
            <Show above="xl">
               <SideBar />
            </Show>
            <Box w="100%" overflowY="auto" height="calc(100vh - 100px)">
               <Container as="main" paddingY="4">
                  <Select placeholder="Select colour scheme" onChange={(e) => setColorScheme(e.target.value)}>
                     <option value="gray">Gray</option>
                     <option value="red">Red</option>
                     <option value="orange">Orange</option>
                     <option value="yellow">Yellow</option>
                     <option value="green">Green</option>
                     <option value="teal">Teal</option>
                     <option value="blue">Blue</option>
                     <option value="cyan">Cyan</option>
                     <option value="purple">Purple</option>
                     <option value="pink">Pink</option>
                  </Select>
               </Container>
            </Box>
         </Flex>
         <Show below="md">
            <BottomNav />
         </Show>
      </Flex>
   );
};

export default App;
