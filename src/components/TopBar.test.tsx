/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * TopBar.test.tsx: This file contains the tests for the TopBar component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { APIProvider } from '@jbloggz/use-api';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../providers';
import { TopBar } from '.';


describe('TopBar', () => {
   it('Renders the TopBar', () => {
      render(
         <MemoryRouter initialEntries={['/']}>
            <APIProvider>
               <AuthContext.Provider value={{ login: vi.fn(), logout: vi.fn() }}>
                  <TopBar />
               </AuthContext.Provider>
            </APIProvider>
         </MemoryRouter>
      );
      const settings_btn = screen.getByLabelText('Settings');
      expect(settings_btn).toBeInTheDocument();
   });

   it('Clicking the logout button calls logout()', () => {
      const mockLogout = vi.fn();
      render(
         <MemoryRouter>
            <APIProvider>
               <AuthContext.Provider value={{ login: vi.fn(), logout: mockLogout }}>
                  <TopBar />
               </AuthContext.Provider>
            </APIProvider>
         </MemoryRouter>
      );
      const logout_btn = screen.getByLabelText('Logout');
      logout_btn.click();
      expect(mockLogout.mock.calls).toHaveLength(1);
   });
});
