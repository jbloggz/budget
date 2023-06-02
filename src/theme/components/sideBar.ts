/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * sideBar.ts: This file contains the styles for the SideBar component
 */

import { defineStyle, defineStyleConfig, StyleFunctionProps } from '@chakra-ui/styled-system';
import { mode } from '@chakra-ui/theme-tools';

const sideBarStyle = defineStyle((props) => {
   const { colorScheme: c } = props;
   let bg;

   if (c === 'gray') {
      bg = mode(`gray.100`, `gray.700`)(props);
   } else {
      bg = mode(`${c}.500`, `${c}.200`)(props);
   }
   return {
      bg,
   };
});

export const sideBarTheme = defineStyleConfig({
   baseStyle: (props: StyleFunctionProps) => sideBarStyle(props),
});
