/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * App.test.tsx: This file contains the tests for the App component
 */

import { describe, it, vi, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '.';

/* Mock the useNavigate() hook */
vi.mock('react-router-dom', async () => {
   const actual = (await vi.importActual('react-router-dom')) as object;
   return {
      ...actual,
      useNavigate: vi.fn(),
   };
});

describe('App', () => {
   it('renders login page by default', () => {
      render(<App />);
      const btn = screen.getByRole('button', { name: 'Sign in' });
      expect(btn).toBeInTheDocument();
   });
});
