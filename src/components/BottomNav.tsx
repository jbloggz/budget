/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * BottomNav.tsx: This file contains the bottom navigation component
 */

import { CalendarIcon, SettingsIcon, TimeIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';

const BottomNav = () => {
   return (
      <Flex as="nav" justify="space-evenly">
         <IconButton aria-label="Allocations" flex="1" borderRight="1px" borderRadius={0} icon={<TimeIcon />} />
         <IconButton aria-label="Transactions" flex="1" borderX="1px" borderRadius={0} icon={<CalendarIcon />} />
         <IconButton aria-label="Settings" flex="1" borderLeft="1px" borderRadius={0} icon={<SettingsIcon />} />
      </Flex>
   );
};

export default BottomNav;
