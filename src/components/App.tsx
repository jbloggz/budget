/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * App.tsx: This file contains the top level App component
 */

import { Box, Flex, Show } from '@chakra-ui/react';
import { TopBar } from './TopBar';
import { SideBar } from './SideBar';
import { BottomNav } from './BottomNav';
import { Settings } from '../pages/Settings';

const App = () => {
   return (
      <Flex direction="column" minHeight="100vh">
         <TopBar />
         <Flex flex="1">
            <Show above="xl">
               <SideBar />
            </Show>
            <Box w="100%" overflowY="auto" height="calc(100vh - 100px)">
               <Settings />
            </Box>
         </Flex>
         <Show below="md">
            <BottomNav />
         </Show>
      </Flex>
   );
};

export default App;
