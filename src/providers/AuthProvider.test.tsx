/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * AuthProvider.test.tsx: This file contains the tests for the AuthProvider
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AuthProvider } from '.';

const TestingComponent = () => {
   return <p>Logged in</p>;
};

describe('AuthProvider', () => {
   it('can render the AuthProvider', () => {
      render(
         <MemoryRouter>
            <AuthProvider></AuthProvider>
         </MemoryRouter>
      );
   });

   it('is not logged in initially', () => {
      render(
         <MemoryRouter>
            <AuthProvider>
               <TestingComponent />
            </AuthProvider>
         </MemoryRouter>
      );
      const btn = screen.getByRole('button', { name: 'Sign in' });
      expect(btn).toBeInTheDocument();
   });
});
