/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * ThemeProvider.test.tsx: This file contains the tests for the ThemeProvider
 */

import { describe, expect, it, vi } from 'vitest';
import { useContext, useEffect } from 'react';
import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { ThemeContext, ThemeProvider } from '.';
import { themeType } from '../theme';

const TestingComponent = () => {
   const { theme, setTheme } = useContext(ThemeContext);
   useEffect(() => {
      setTheme('red');
   }, [setTheme]);
   return <p>{theme}</p>;
};

describe('ThemeProvider', () => {
   it('can render the ThemeProvider', () => {
      const theme: themeType = 'dark';
      const setTheme = vi.fn();
      render(<ThemeProvider theme={theme} setTheme={setTheme}></ThemeProvider>);
   });

   it('can update the theme', () => {
      const theme: themeType = 'dark';
      const setTheme = vi.fn();
      render(
         <ChakraProvider>
            <ThemeProvider theme={theme} setTheme={setTheme}>
               <TestingComponent />
            </ThemeProvider>
         </ChakraProvider>
      );
      expect(setTheme.mock.calls).toHaveLength(1);
      expect(setTheme.mock.calls[0][0]).toBe('red');
   });
});
