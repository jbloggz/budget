/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Transactions.test.tsx: This file contains the tests for the Transactions page
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Transactions } from '.';

describe('Transactions', () => {
   it('renders the transactions page', () => {
      render(<Transactions />);
      const title = screen.getByText('Transactions');
      expect(title).toBeInTheDocument();
   });
});
