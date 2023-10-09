/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * TreeView.test.tsx: This file contains the tests for the TreeView component
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TreeView } from '.';

describe('TreeView', () => {
   it('Renders an empty TreeView', () => {
      const { container } = render(<TreeView role="test" />);
      const stack = container.querySelector('[role="test"]');
      expect(stack).toBeTruthy();
      expect(stack?.hasChildNodes()).toBeFalsy();
   });
});
