/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * util.ts: This file contains the tests for the util functions
 */

import { describe, it, expect } from 'vitest';
import { isNonEmptyString } from './util';

describe('isNonEmptyString', () => {
   it('correctly checks a non-empty string', () => {
      expect(isNonEmptyString('sdfkhef')).toBe(true);
   });

   it('correctly checks an empty string', () => {
      expect(isNonEmptyString('')).toBe(false);
   });

   it('correctly checks other types', () => {
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString([1, 2, 3])).toBe(false);
      expect(isNonEmptyString({ foo: 1 })).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
   });
});
