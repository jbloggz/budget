/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Allocations.test.tsx: This file contains the tests for the Allocations page
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Allocations } from '.';

describe('Allocations', () => {
   it('renders the allocations page', () => {
      render(<Allocations />);
      const title = screen.getByText('Allocations');
      expect(title).toBeInTheDocument();
   });
});
