/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Login.test.tsx: This file contains the tests for the Login page
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Login } from '.';

describe('Login', () => {
   it('renders the login page', () => {
      render(<Login />);
      const btn = screen.getByRole('button', { name: 'Sign in' });
      expect(btn).toBeInTheDocument();
   });
});
