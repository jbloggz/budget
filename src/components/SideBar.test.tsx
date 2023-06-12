/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * SideBar.test.tsx: This file contains the tests for the SideBar component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SideBar } from '.';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../providers';

describe('SideBar', () => {
   it('Renders the Navlst in the sidebar', () => {
      render(
         <MemoryRouter initialEntries={['/']}>
            <AuthContext.Provider value={{ login: vi.fn(), logout: vi.fn() }}>
               <SideBar />
            </AuthContext.Provider>
         </MemoryRouter>
      );
      const dash_btn = screen.getByLabelText('Dashboard');
      expect(dash_btn).toBeInTheDocument();
   });
});
