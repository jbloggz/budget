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
import { APIProvider } from '@jbloggz/use-api';


describe('Dashboard', () => {
   it('renders the dashboard page', () => {
      render(
         <APIProvider>
            <Dashboard />
         </APIProvider>
      );
      const title = screen.getByText('Dashboard');
      expect(title).toBeInTheDocument();
   });
});
