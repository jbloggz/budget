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
import type { themeType } from './theme.types';

export { ThemeContext, ThemeProvider } from './ThemeProvider.tsx';
export type { themeType, themeContextType } from './theme.types';
export const themes = ['light', 'dark', 'red', 'orange', 'yellow', 'green', 'blue', 'teal', 'cyan', 'purple', 'pink'] as const;

const config: ThemeConfig = {
   initialColorMode: 'light',
   useSystemColorMode: false,
   cssVarPrefix: 'jbloggz-budget',
};

export const themeConfig = (theme: themeType) => {
   const colorScheme = theme === 'light' || theme === 'dark' ? 'gray' : theme;
   return extendTheme(
      {
         config,
         styles,
         components,
      },
      withDefaultColorScheme({ colorScheme })
   );
};
