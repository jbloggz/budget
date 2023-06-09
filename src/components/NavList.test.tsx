/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * NavList.test.tsx: This file contains the tests for the NavList component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavList } from '.';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../providers';

describe('NavList', () => {
   it('Highlights the dashboard button when page is active', () => {
      render(
         <MemoryRouter initialEntries={['/']}>
            <NavList />
         </MemoryRouter>
      );
      const dash_btn = screen.getByLabelText('Dashboard');
      const allo_btn = screen.getByLabelText('Allocations');
      const tran_btn = screen.getByLabelText('Transactions');
      const sett_btn = screen.getByLabelText('Settings');
      expect(dash_btn).toHaveAttribute('data-active');
      expect(allo_btn).not.toHaveAttribute('data-active');
      expect(tran_btn).not.toHaveAttribute('data-active');
      expect(sett_btn).not.toHaveAttribute('data-active');
   });

   it('Highlights the allocations button when page is active', () => {
      render(
         <MemoryRouter initialEntries={['/allocations']}>
            <NavList />
         </MemoryRouter>
      );
      const dash_btn = screen.getByLabelText('Dashboard');
      const allo_btn = screen.getByLabelText('Allocations');
      const tran_btn = screen.getByLabelText('Transactions');
      const sett_btn = screen.getByLabelText('Settings');
      expect(dash_btn).not.toHaveAttribute('data-active');
      expect(allo_btn).toHaveAttribute('data-active');
      expect(tran_btn).not.toHaveAttribute('data-active');
      expect(sett_btn).not.toHaveAttribute('data-active');
   });

   it('Highlights the transactions button when page is active', () => {
      render(
         <MemoryRouter initialEntries={['/transactions']}>
            <NavList />
         </MemoryRouter>
      );
      const dash_btn = screen.getByLabelText('Dashboard');
      const allo_btn = screen.getByLabelText('Allocations');
      const tran_btn = screen.getByLabelText('Transactions');
      const sett_btn = screen.getByLabelText('Settings');
      expect(dash_btn).not.toHaveAttribute('data-active');
      expect(allo_btn).not.toHaveAttribute('data-active');
      expect(tran_btn).toHaveAttribute('data-active');
      expect(sett_btn).not.toHaveAttribute('data-active');
   });

   it('Highlights the settings button when page is active', () => {
      render(
         <MemoryRouter initialEntries={['/settings']}>
            <NavList />
         </MemoryRouter>
      );
      const dash_btn = screen.getByLabelText('Dashboard');
      const allo_btn = screen.getByLabelText('Allocations');
      const tran_btn = screen.getByLabelText('Transactions');
      const sett_btn = screen.getByLabelText('Settings');
      expect(dash_btn).not.toHaveAttribute('data-active');
      expect(allo_btn).not.toHaveAttribute('data-active');
      expect(tran_btn).not.toHaveAttribute('data-active');
      expect(sett_btn).toHaveAttribute('data-active');
   });

   it('Clicking the logout button calls logout()', () => {
      const mockLogout = vi.fn();
      render(
         <MemoryRouter>
            <AuthContext.Provider value={{ login: vi.fn(), logout: mockLogout }}>
               <NavList />
            </AuthContext.Provider>
         </MemoryRouter>
      );
      const logout_btn = screen.getByLabelText('Logout');
      logout_btn.click();
      expect(mockLogout.mock.calls).toHaveLength(1);
   });
});
