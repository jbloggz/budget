/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * NavList.tsx: This file contains the navigation items list component
 */

import { Link, useLocation } from 'react-router-dom';
import { CalendarIcon, InfoOutlineIcon, LockIcon, SettingsIcon, StarIcon, TimeIcon } from '@chakra-ui/icons';
import { Button, List, ListItem } from '@chakra-ui/react';
import { AuthContext, useContext } from '../providers';

const NavList = () => {
   const location = useLocation();
   const { logout } = useContext(AuthContext);
   return (
      <List>
         <ListItem>
            <Button
               as={Link}
               to="/"
               isActive={location.pathname === '/'}
               aria-label="Dashboard"
               justifyContent="left"
               pl="8"
               width="100%"
               borderRadius={0}
               leftIcon={<StarIcon />}
            >
               Dashboard
            </Button>
         </ListItem>
         <ListItem>
            <Button
               as={Link}
               to="allocations"
               isActive={location.pathname === '/allocations'}
               aria-label="Allocations"
               justifyContent="left"
               pl="8"
               width="100%"
               borderRadius={0}
               leftIcon={<TimeIcon />}
            >
               Allocations
            </Button>
         </ListItem>
         <ListItem>
            <Button
               as={Link}
               to="transactions"
               isActive={location.pathname === '/transactions'}
               aria-label="Transactions"
               justifyContent="left"
               pl="8"
               width="100%"
               borderRadius={0}
               leftIcon={<CalendarIcon />}
            >
               Transactions
            </Button>
         </ListItem>
         <ListItem>
            <Button
               as={Link}
               to="settings"
               isActive={location.pathname === '/settings'}
               aria-label="Settings"
               justifyContent="left"
               pl="8"
               width="100%"
               borderRadius={0}
               leftIcon={<SettingsIcon />}
            >
               Settings
            </Button>
         </ListItem>
         <ListItem>
            <Button
               as={Link}
               to="logs"
               isActive={location.pathname === '/logs'}
               aria-label="Logs"
               justifyContent="left"
               pl="8"
               width="100%"
               borderRadius={0}
               leftIcon={<InfoOutlineIcon />}
            >
               Logs
            </Button>
         </ListItem>
         <ListItem>
            <Button aria-label="Logout" justifyContent="left" pl="8" width="100%" borderRadius={0} leftIcon={<LockIcon />} onClick={logout}>
               Logout
            </Button>
         </ListItem>
      </List>
   );
};

export default NavList;
