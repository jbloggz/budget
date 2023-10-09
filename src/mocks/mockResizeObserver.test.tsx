/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * mockResizeObserver.test.tsx: This file contains the tests for mockResizeObserver
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { mockResizeObserver } from '.';

describe('mockResizeObserver', () => {
   beforeEach(() => {
      mockResizeObserver.reset();
      mockResizeObserver.disable();
   });

   it('is not mocked by default', () => {
      expect(ResizeObserver).not.toBeDefined();
   });

   it('can be enabled', () => {
      expect(ResizeObserver).not.toBeDefined();
      mockResizeObserver.enable();
      expect(ResizeObserver).toBeDefined();
      expect(ResizeObserver).toBeInstanceOf(Object);
   });

   it('can be disabled', () => {
      expect(ResizeObserver).not.toBeDefined();
      mockResizeObserver.enable();
      expect(ResizeObserver).toBeDefined();
      expect(ResizeObserver).toBeInstanceOf(Object);
      mockResizeObserver.disable();
      expect(ResizeObserver).not.toBeDefined();
   });
});
