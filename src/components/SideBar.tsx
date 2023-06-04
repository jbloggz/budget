/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Sidebar.tsx: This file contains the sidebar navigation component
 */

import { Box, useStyleConfig } from '@chakra-ui/react';
import { NavList } from './NavList';

export const SideBar = () => {
   const styles = useStyleConfig('SideBar');
   return (
      <Box minWidth="xs" as="aside" __css={styles}>
         <NavList />
      </Box>
   );
};
