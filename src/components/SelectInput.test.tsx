/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * SelectInput.test.tsx: This file contains the tests for the SelectInput component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { mockResizeObserver } from '../mocks';
import { SelectInput } from '.';

describe('SelectInput', () => {
   beforeEach(() => {
      mockResizeObserver.reset();
   });

   it('Renders a SelectInput', () => {
      const { container } = render(<SelectInput name={'test'} options={['foo', 'bar']} value={''} onChange={vi.fn} />);
      const elem = container.querySelector('input');
      expect(elem).toBeInTheDocument();
   });
});
