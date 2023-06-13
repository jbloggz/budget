/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * BottomNav.tsx: This file contains the bottom navigation component
 */

import { Link, useLocation } from 'react-router-dom';
import { CalendarIcon, StarIcon, TimeIcon } from '@chakra-ui/icons';
import { Flex, IconButton } from '@chakra-ui/react';

const BottomNav = () => {
   const location = useLocation();
   return (
      <Flex as="nav" justify="space-evenly">
         <IconButton
            as={Link}
            isActive={location.pathname === '/'}
            to="/"
            aria-label="Dashboard"
            flex="1"
            borderTop="1px"
            borderRadius={0}
            icon={<StarIcon />}
         />
         <IconButton
            as={Link}
            isActive={location.pathname === '/allocations'}
            to="allocations"
            aria-label="Allocations"
            flex="1"
            borderX="1px"
            borderTop="1px"
            borderRadius={0}
            icon={<TimeIcon />}
         />
         <IconButton
            as={Link}
            isActive={location.pathname === '/transactions'}
            to="transactions"
            aria-label="Transactions"
            flex="1"
            borderTop="1px"
            borderRadius={0}
            icon={<CalendarIcon />}
         />
      </Flex>
   );
};

export default BottomNav;
