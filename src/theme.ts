/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * main.tsx: This file contains the top level App component
 */

import { mode } from '@chakra-ui/theme-tools';
import { extendTheme, type ThemeConfig } from '@chakra-ui/react';
import type { StyleFunctionProps } from '@chakra-ui/styled-system';

const config: ThemeConfig = {
   initialColorMode: 'dark',
   useSystemColorMode: false,
};

const theme = extendTheme({
   config,
   styles: {
      global: (props: StyleFunctionProps) => ({
         body: {
            bg: mode('gray.100', null)(props),
         },
         header: {
            bg: mode('teal.500', 'teal.200')(props),
         },
         aside: {
            bg: mode('teal.500', 'teal.200')(props),
         },
         h1: {
            color: 'blackAlpha.800',
         },
      }),
   },
});

export default theme;
