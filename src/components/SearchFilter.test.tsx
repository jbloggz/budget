/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * SearchFilter.test.tsx: This file contains the tests for the SearchFilter component
 */

import { describe, it, expect, vi } from 'vitest';
import { render} from '@testing-library/react';
import { SearchFilter } from '.';

describe('SearchFilter', () => {
   it('Renders a SearchFilter', () => {
      const {container} = render(<SearchFilter onChange={vi.fn()}/>);
      const elem = container.querySelector('input');
      expect(elem).toBeInTheDocument();
   });
});
