/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Settings.test.tsx: This file contains the tests for the Settings page
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../providers';
import { Settings } from '.';

const queryClient = new QueryClient();

describe('Settings', () => {
   it('renders the settings page', () => {
      const theme = 'light';
      render(
         <ThemeProvider theme={theme} setTheme={vi.fn()}>
            <QueryClientProvider client={queryClient}>
               <Settings />
            </QueryClientProvider>
         </ThemeProvider>
      );
      const title = screen.getByText('Settings');
      expect(title).toBeInTheDocument();
   });
});
