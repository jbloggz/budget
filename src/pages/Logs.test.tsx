/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Logs.test.tsx: This file contains the tests for the Logs page
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../providers';
import { Logs } from '.';

const queryClient = new QueryClient();

describe('Logs', () => {
   it('renders the logs page', () => {
      const theme = 'light';
      render(
         <ThemeProvider theme={theme} setTheme={vi.fn()}>
            <QueryClientProvider client={queryClient}>
               <Logs />
            </QueryClientProvider>
         </ThemeProvider>
      );
      const title = screen.getByText('Logs');
      expect(title).toBeInTheDocument();
   });
});
