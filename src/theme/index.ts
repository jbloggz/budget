/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * index.ts: This file extends the default Chakra theme
 */

import { extendTheme, withDefaultColorScheme, type ThemeConfig } from '@chakra-ui/react';
import styles from './styles';
import { components } from './components';

const config: ThemeConfig = {
   initialColorMode: 'dark',
   useSystemColorMode: false,
   cssVarPrefix: 'jbloggz-budget',
};

const theme = (colorScheme: string) => {
   return extendTheme(
      {
         config,
         styles,
         components
      },
      withDefaultColorScheme({ colorScheme })
   );
};

export default theme;
