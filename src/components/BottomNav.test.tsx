/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * BottomNav.test.tsx: This file contains the tests for the BottomNav component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottomNav } from '.';
import { MemoryRouter } from 'react-router-dom';

describe('BottomNav', () => {
   it('Highlights the dashboard button when page is active', () => {
      render(
         <MemoryRouter initialEntries={['/']}>
            <BottomNav />
         </MemoryRouter>
      );
      const dash_btn = screen.getByLabelText('Dashboard');
      const allo_btn = screen.getByLabelText('Allocations');
      const tran_btn = screen.getByLabelText('Transactions');
      expect(dash_btn).toHaveAttribute('data-active');
      expect(allo_btn).not.toHaveAttribute('data-active');
      expect(tran_btn).not.toHaveAttribute('data-active');
   });

   it('Highlights the allocations button when page is active', () => {
      render(
         <MemoryRouter initialEntries={['/allocations']}>
            <BottomNav />
         </MemoryRouter>
      );
      const dash_btn = screen.getByLabelText('Dashboard');
      const allo_btn = screen.getByLabelText('Allocations');
      const tran_btn = screen.getByLabelText('Transactions');
      expect(dash_btn).not.toHaveAttribute('data-active');
      expect(allo_btn).toHaveAttribute('data-active');
      expect(tran_btn).not.toHaveAttribute('data-active');
   });

   it('Highlights the transactions button when page is active', () => {
      render(
         <MemoryRouter initialEntries={['/transactions']}>
            <BottomNav />
         </MemoryRouter>
      );
      const dash_btn = screen.getByLabelText('Dashboard');
      const allo_btn = screen.getByLabelText('Allocations');
      const tran_btn = screen.getByLabelText('Transactions');
      expect(dash_btn).not.toHaveAttribute('data-active');
      expect(allo_btn).not.toHaveAttribute('data-active');
      expect(tran_btn).toHaveAttribute('data-active');
   });
});
