/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Settings.test.tsx: This file contains the tests for the Settings page
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Settings } from '.';

describe('Settings', () => {
   it('renders the settings page', () => {
      render(<Settings />);
      const title = screen.getByText('Settings');
      expect(title).toBeInTheDocument();
   });
});
