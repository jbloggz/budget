/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * App.test.tsx: This file contains the tests for the App component
 */

import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { App } from '.';

describe('App', () => {
   it('renders login page by default', async () => {
      render(
         <MemoryRouter>
            <App />
         </MemoryRouter>
      );
      await waitFor(() => expect(screen.getByText('Sign in').textContent).toBe('Sign in'));
      const btn = screen.getByRole('button', { name: 'Sign in' });
      expect(btn).toBeInTheDocument();
   });
});
