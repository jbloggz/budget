/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * util.test.ts: This file contains the utility function tests
 */

import { describe, it, expect } from 'vitest';
import { prettyAmount, prettyDate } from './utils';

describe('prettyAmount', () => {
   it('zero', () => {
      expect(prettyAmount(0)).toBe('$0.00');
   });

   it('positive whole dollar', () => {
      expect(prettyAmount(23100)).toBe('$231.00');
   });

   it('positive fraction dollar', () => {
      expect(prettyAmount(2761)).toBe('$27.61');
   });

   it('negative whole dollar', () => {
      expect(prettyAmount(-23100)).toBe('-$231.00');
   });

   it('negative fraction dollar', () => {
      expect(prettyAmount(-2761)).toBe('-$27.61');
   });

   it('floating point', () => {
      expect(prettyAmount(34.345)).toBe('$0.34');
   });
});

describe('prettyDate', () => {
   it('Processes a valid date successfully', () => {
      expect(prettyDate('2022-02-04')).toBe('04/02/2022');
   });

   it('Fails on an invalid date', () => {
      expect(prettyDate('22-02-04')).toBe('Invalid Date');
   });
});
