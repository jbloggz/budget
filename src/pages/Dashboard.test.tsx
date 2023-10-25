/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Dashboard.test.tsx: This file contains the tests for the Dashboard page
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dashboard } from '.';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

describe('Dashboard', () => {
   it('renders the dashboard page', () => {
      render(
         <QueryClientProvider client={queryClient}>
            <Dashboard />
         </QueryClientProvider>
      );
      const title = screen.getByText('Dashboard');
      expect(title).toBeInTheDocument();
   });
});
