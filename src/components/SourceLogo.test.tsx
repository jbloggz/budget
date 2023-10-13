/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * SourceLogo.test.tsx: This file contains the tests for the SourceLogo component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SourceLogo } from '.';

describe('SourceLogo', () => {
   it('Renders a SourceLogo', () => {
      render(<SourceLogo source={'Foo'} />);
      const elem = screen.getByRole('img');
      expect(elem).toBeInTheDocument();
   });
});
