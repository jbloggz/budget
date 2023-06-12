/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Settings.test.tsx: This file contains the tests for the Settings page
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Settings } from '.';
import { ThemeProvider } from '../providers';

describe('Settings', () => {
   it('renders the settings page', () => {
      const theme = 'light';
      render(
         <ThemeProvider theme={theme} setTheme={vi.fn()}>
            <Settings />
         </ThemeProvider>
      );
      const title = screen.getByText('Settings');
      expect(title).toBeInTheDocument();
   });
});
