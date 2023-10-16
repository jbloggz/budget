/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Transactions.test.tsx: This file contains the tests for the Transactions page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChakraProvider } from '@chakra-ui/react';
import { Theme } from '../app.types';
import { ThemeProvider } from '../providers';
import { Transactions } from '.';
import { mockResizeObserver } from '../mocks';

const queryClient = new QueryClient();

describe('Transactions', () => {
   beforeEach(() => {
      mockResizeObserver.reset();
   });

   it('renders the transactions page', () => {
      const theme: Theme = 'dark';
      const setTheme = vi.fn();
      render(
         <ChakraProvider>
            <ThemeProvider theme={theme} setTheme={setTheme}>
               <QueryClientProvider client={queryClient}>
                  <Transactions />
               </QueryClientProvider>
            </ThemeProvider>
         </ChakraProvider>
      );
      const title = screen.getByText('Transactions');
      expect(title).toBeInTheDocument();
   });
});
