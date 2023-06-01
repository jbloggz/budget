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
   Show,
   useColorMode,
   useDisclosure,
} from '@chakra-ui/react';

const NavList = () => {
   return (
      <List>
         <ListItem>
            <Button aria-label="Allocations" justifyContent="left" pl="8" width="100%" borderRadius={0} leftIcon={<TimeIcon />} colorScheme="teal">
               Allocations
            </Button>
         </ListItem>
         <ListItem>
            <Button
               aria-label="Transactions"
               justifyContent="left"
               pl="8"
               width="100%"
               borderRadius={0}
               leftIcon={<CalendarIcon />}
               colorScheme="teal"
            >
               Transactions
            </Button>
         </ListItem>
         <ListItem>
            <Button aria-label="Settings" justifyContent="left" pl="8" width="100%" borderRadius={0} leftIcon={<SettingsIcon />} colorScheme="teal">
               Settings
            </Button>
         </ListItem>
      </List>
   );
};

const BottomNav = () => {
   return (
      <Flex as="nav" justify="space-evenly">
         <IconButton aria-label="Allocations" flex="1" borderRight="1px" borderRadius={0} icon={<TimeIcon />} colorScheme="teal" />
         <IconButton aria-label="Transactions" flex="1" borderX="1px" borderRadius={0} icon={<CalendarIcon />} colorScheme="teal" />
         <IconButton aria-label="Settings" flex="1" borderLeft="1px" borderRadius={0} icon={<SettingsIcon />} colorScheme="teal" />
      </Flex>
   );
};

const App = () => {
   // Here's the signature
   const { colorMode, toggleColorMode } = useColorMode();
   const { isOpen, onOpen, onClose } = useDisclosure();

   return (
      <Flex direction="column" minHeight="100vh">
         <Flex as="header" p="2">
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
                     <IconButton aria-label="Navigation" icon={<HamburgerIcon />} colorScheme="teal" onClick={onOpen} />
                  </Show>
               </Hide>
               <IconButton
                  aria-label="Navigation"
                  icon={colorMode === 'light' ? <SunIcon /> : <MoonIcon />}
                  colorScheme="teal"
                  onClick={toggleColorMode}
               />
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
         <Flex flex="1">
            <Show above="xl">
               <Box minWidth="xs" as="aside">
                  <NavList />
               </Box>
            </Show>
            <Box w="100%" overflowY="auto" height="calc(100vh - 100px)">
               <Container as="main" paddingY="4">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Repellendus quia nemo atque ullam? Voluptatem, nemo? Asperiores laboriosam
                  facilis rem, numquam quod autem. Molestiae alias et beatae, nostrum doloribus possimus temporibus? Lorem ipsum dolor sit, amet
                  consectetur adipisicing elit. Amet laboriosam officiis reprehenderit quo facilis dolores rerum alias veritatis sed, maxime,
                  explicabo eligendi, sequi exercitationem facere soluta beatae quam impedit neque! Lorem ipsum dolor sit, amet consectetur
                  adipisicing elit. Amet laboriosam officiis reprehenderit quo facilis dolores rerum alias veritatis sed, maxime, explicabo eligendi,
                  sequi exercitationem facere soluta beatae quam impedit neque! Lorem ipsum dolor sit, amet consectetur adipisicing elit. Amet
                  laboriosam officiis reprehenderit quo facilis dolores rerum alias veritatis sed, maxime, explicabo eligendi, sequi exercitationem
                  facere soluta beatae quam impedit neque! Lorem ipsum dolor sit, amet consectetur adipisicing elit. Amet laboriosam officiis
                  reprehenderit quo facilis dolores rerum alias veritatis sed, maxime, explicabo eligendi, sequi exercitationem facere soluta beatae
                  quam impedit neque! Lorem ipsum dolor sit, amet consectetur adipisicing elit. Amet laboriosam officiis reprehenderit quo facilis
                  dolores rerum alias veritatis sed, maxime, explicabo eligendi, sequi exercitationem facere soluta beatae quam impedit neque! Lorem
                  ipsum dolor sit, amet consectetur adipisicing elit. Amet laboriosam officiis reprehenderit quo facilis dolores rerum alias veritatis
                  sed, maxime, explicabo eligendi, sequi exercitationem facere soluta beatae quam impedit neque!
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
