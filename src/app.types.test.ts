/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * app.types.test.ts: This file contains the tests for the types guards
 */

import { describe, it, expect } from 'vitest';
import { isAPIAuthTokens, isCategorisation, isNonEmptyString, isTransaction, isTransactionList } from './app.types';

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

describe('isAPIAuthTokens', () => {
   it('correctly checks API tokens', () => {
      expect(isAPIAuthTokens({ access_token: 'foo', refresh_token: 'foo', token_type: 'bearer' })).toBe(true);
   });

   it('fails for incorrect token_type', () => {
      expect(isAPIAuthTokens({ access_token: 'foo', refresh_token: 'foo', token_type: 'cookie' })).toBe(false);
   });

   it('fails for missing properties', () => {
      expect(isAPIAuthTokens({ access_token: 'foo', refresh_token: 'foo' })).toBe(false);
      expect(isAPIAuthTokens({ access_token: 'foo', token_type: 'cookie' })).toBe(false);
      expect(isAPIAuthTokens({ refresh_token: 'foo', token_type: 'cookie' })).toBe(false);
   });

   it('fails for incorrect properties', () => {
      expect(isAPIAuthTokens({ access_token: 1, refresh_token: 'foo', token_type: 'bearer' })).toBe(false);
      expect(isAPIAuthTokens({ access_token: 'foo', refresh_token: 2, token_type: 'bearer' })).toBe(false);
      expect(isAPIAuthTokens({ access_token: 'foo', refresh_token: 'foo', token_type: 3 })).toBe(false);
   });
});

describe('isTransaction', () => {
   it('correctly checks transaction', () => {
      expect(isTransaction({ date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' })).toBe(true);
      expect(isTransaction({ id: 123, date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' })).toBe(true);
   });

   it('fails for missing properties', () => {
      expect(isTransaction({ amount: 1221, description: 'Foo Bar', source: 'bank of Foo' })).toBe(false);
      expect(isTransaction({ date: '2023-03-04', description: 'Foo Bar', source: 'bank of Foo' })).toBe(false);
      expect(isTransaction({ date: '2023-03-04', amount: 1221, source: 'bank of Foo' })).toBe(false);
      expect(isTransaction({ date: '2023-03-04', amount: 1221, description: 'Foo Bar' })).toBe(false);
   });

   it('fails for incorrect properties', () => {
      expect(isTransaction({ id: 'hello', date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' })).toBe(false);
      expect(isTransaction({ id: 123, date: 456, amount: 1221, description: 'Foo Bar', source: 'bank of Foo' })).toBe(false);
      expect(isTransaction({ date: '2023-03-04', amount: [], description: 'Foo Bar', source: 'bank of Foo' })).toBe(false);
      expect(isTransaction({ date: '2023-03-04', amount: 1221, description: {}, source: 'bank of Foo' })).toBe(false);
      expect(isTransaction({ date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: true })).toBe(false);
   });
});

describe('isTransactionList', () => {
   it('correctly checks empty list', () => {
      expect(isTransactionList({ total: 0, transactions: [] })).toBe(true);
      expect(isTransaction({ id: 123, date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' })).toBe(true);
   });

   it('correctly checks populated list', () => {
      expect(isTransactionList({ total: 0, transactions: [] })).toBe(true);
      expect(
         isTransactionList({ total: 1, transactions: [{ id: 123, date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' }] })
      ).toBe(true);
      expect(
         isTransactionList({
            total: 10,
            transactions: [
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
            ],
         })
      ).toBe(true);
   });

   it('fails for missing properties', () => {
      expect(isTransactionList({ transactions: [] })).toBe(false);
      expect(isTransactionList({ total: 4 })).toBe(false);
   });

   it('fails for incorrect properties', () => {
      expect(isTransactionList({ transactions: 5, total: 7 })).toBe(false);
      expect(isTransactionList({ transactions: [], total: {} })).toBe(false);
   });

   it('fails for incorrect transactions', () => {
      expect(
         isTransactionList({
            total: 10,
            transactions: [
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: 5, amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
            ],
         })
      ).toBe(false);
   });

   it('fails for incorrect total', () => {
      expect(
         isTransactionList({
            total: 3,
            transactions: [
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
               { date: '2023-03-04', amount: 1221, description: 'Foo Bar', source: 'bank of Foo' },
            ],
         })
      ).toBe(false);
   });
});

describe('isCategorisation', () => {
   it('correctly checks empty lists', () => {
      expect(isCategorisation({ categories: [], locations: [] })).toBe(true);
   });

   it('correctly checks populated lists', () => {
      expect(
         isCategorisation({
            categories: [
               { name: 'test', score: 23.1 },
               { name: 'hello', score: 43.0 },
            ],
            locations: [
               { name: 'foo', score: 21.1 },
               { name: 'bar', score: 6.0 },
               { name: 'baz', score: 0.1 },
               { name: 'bill', score: 123.0 },
            ],
         })
      ).toBe(true);
   });

   it('fails for missing category/location', () => {
      expect(isCategorisation({ categories: ['test', 'hello'] })).toBe(false);
      expect(isCategorisation({ locations: ['test', 'hello'] })).toBe(false);
   });

   it('fails for incorrect category/location type', () => {
      expect(isCategorisation({ categories: 1, locations: ['foo', 'bar', 'baz'] })).toBe(false);
      expect(isCategorisation({ locations: 1, categories: ['foo', 'bar', 'baz'] })).toBe(false);
   });
});
