/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Login.test.tsx: This file contains the tests for the Login page
 */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AuthContext } from '../providers';
import { Login } from '.';

describe('Login', () => {
   it('renders the login page', () => {
      render(
         <AuthContext.Provider value={{ login: vi.fn(), logout: vi.fn() }}>
            <Login isLoading={false} />
         </AuthContext.Provider>
      );
      const btn = screen.getByRole('button', { name: 'Sign in' });
      expect(btn).toBeInTheDocument();
   });

   it('Dont attempt to login if the user is not filled in', () => {
      const mockLogin = vi.fn();
      render(
         <AuthContext.Provider value={{ login: mockLogin, logout: vi.fn() }}>
            <Login isLoading={false} />
         </AuthContext.Provider>
      );
      const login_btn = screen.getByRole('button', { name: 'Sign in' });
      login_btn.click();
      expect(mockLogin.mock.calls).toHaveLength(0);
   });

   it('Dont attempt to login if the password is not filled in', () => {
      const mockLogin = vi.fn();
      render(
         <AuthContext.Provider value={{ login: mockLogin, logout: vi.fn() }}>
            <Login isLoading={false} />
         </AuthContext.Provider>
      );
      const login_btn = screen.getByRole('button', { name: 'Sign in' });
      const email = screen.getByLabelText('Email');
      fireEvent.change(email, { target: { value: 'joe@test.com' } });
      login_btn.click();
      expect(mockLogin.mock.calls).toHaveLength(0);
   });

   it('Do attempt to login if user/password is filled in', () => {
      const mockLogin = vi.fn();
      mockLogin.mockReturnValue(Promise.resolve({success: true}));
      render(
         <AuthContext.Provider value={{ login: mockLogin, logout: vi.fn() }}>
            <Login isLoading={false} />
         </AuthContext.Provider>
      );
      const login_btn = screen.getByRole('button', { name: 'Sign in' });
      const email = screen.getByLabelText('Email');
      const pass = screen.getByLabelText('Password');
      fireEvent.change(email, { target: { value: 'joe@test.com' } });
      fireEvent.change(pass, { target: { value: 'foobar' } });
      login_btn.click();
      expect(mockLogin.mock.calls).toHaveLength(1);
   });
});
