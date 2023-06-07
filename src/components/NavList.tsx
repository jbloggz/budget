/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * NavList.tsx: This file contains the navigation items list component
 */

import { useContext } from 'react';
import { CalendarIcon, LockIcon, SettingsIcon, TimeIcon } from '@chakra-ui/icons';
import { Button, List, ListItem } from '@chakra-ui/react';
import { AuthContext, authContextType } from '../providers';

const NavList = () => {
   const { logout } = useContext<authContextType>(AuthContext);
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
         <ListItem>
            <Button aria-label="Settings" justifyContent="left" pl="8" width="100%" borderRadius={0} leftIcon={<LockIcon />} onClick={logout}>
               Logout
            </Button>
         </ListItem>
      </List>
   );
};

export default NavList;
