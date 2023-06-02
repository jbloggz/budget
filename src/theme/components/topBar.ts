/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * topBar.ts: This file contains the styles for the TopBar component
 */

import { defineStyle, defineStyleConfig, StyleFunctionProps } from '@chakra-ui/styled-system';
import { mode } from '@chakra-ui/theme-tools';

const topBarStyle = defineStyle((props) => {
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

export const topBarTheme = defineStyleConfig({
   baseStyle: (props: StyleFunctionProps) => topBarStyle(props),
});
