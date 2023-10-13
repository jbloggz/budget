/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Allocations.test.tsx: This file contains the tests for the Allocations page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockResizeObserver } from '../mocks';
import { Theme } from '../app.types';
import { ThemeProvider } from '../providers';
import { Allocations } from '.';
import { MemoryRouter } from 'react-router-dom';

const queryClient = new QueryClient();

describe('Allocations', () => {
   beforeEach(() => {
      mockResizeObserver.reset();
   });

   it('renders the allocations page', () => {
      const theme: Theme = 'dark';
      const setTheme = vi.fn();
      render(
         <MemoryRouter>
            <ThemeProvider theme={theme} setTheme={setTheme}>
               <QueryClientProvider client={queryClient}>
                  <Allocations />
               </QueryClientProvider>
            </ThemeProvider>{' '}
         </MemoryRouter>
      );
      const title = screen.getByText('Allocations');
      expect(title).toBeInTheDocument();
   });
});
