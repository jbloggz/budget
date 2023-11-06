/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * app.types.ts: This file contains all the types that need to be shared across
 * the app
 */

import { themes } from './theme';

/* Either a valid theme name or unknown */
export type Theme = (typeof themes)[number] | undefined;

/* A sort order (asc for ascending and desc for descending */
export type SortOrder = 'asc' | 'desc';

/* A single transaction */
export interface Transaction {
   id?: number;
   date: string;
   amount: number;
   description: string;
   source: string;
   balance?: number;
   pending: boolean;
}

/* A list of transactions */
export type TransactionList = {
   total: number;
   transactions: Transaction[];
};

/* A single allocation */
export interface Allocation {
   id?: number;
   txn_id: number;
   date: string;
   amount: number;
   description: string;
   category: string;
   location: string;
   note: string;
   source: string;
   pending: boolean;
}

/* A list of allocations */
export type AllocationList = {
   total: number;
   allocations: Allocation[];
};

/* A dashboard panel */
export interface DashboardPanel {
   category: string;
   amount: number;
   limit: number;
   diff: number;
}

/* Category/location lists ordered by closest match to a description */
export interface Categorisation {
   categories: { name: string; score: number }[];
   locations: { name: string; score: number }[];
}

/* The credentials used when login in to the app */
export interface LoginCredentials {
   email: string;
   password: string;
   remember: boolean;
}

/* Type predicate for non-empty string */
export const isNonEmptyString = (val: unknown): val is string => {
   return typeof val === 'string' && val !== '';
};

/* Type predicate for Transaction */
export const isTransaction = (val: unknown): val is Transaction => {
   try {
      const test = val as Transaction;
      return (
         (typeof test.id === 'undefined' || typeof test.id === 'number') &&
         typeof test.date === 'string' &&
         typeof test.amount === 'number' &&
         typeof test.description === 'string' &&
         typeof test.source === 'string' &&
         typeof test.pending === 'boolean'
      );
   } catch {
      return false;
   }
};

/* Type predicate for TransactionList */
export const isTransactionList = (val: unknown): val is TransactionList => {
   try {
      const test = val as TransactionList;
      return (
         typeof test.total === 'number' &&
         Array.isArray(test.transactions) &&
         test.transactions.every((t) => isTransaction(t)) &&
         test.total >= test.transactions.length
      );
   } catch {
      return false;
   }
};

/* Type predicate for Allocation */
export const isAllocation = (val: unknown): val is Allocation => {
   try {
      const test = val as Allocation;
      return (
         ((typeof test.id === 'undefined' || typeof test.id === 'number') &&
            typeof test.txn_id === 'number' &&
            typeof test.date === 'string' &&
            typeof test.amount === 'number' &&
            typeof test.description === 'string' &&
            typeof test.source === 'string' &&
            typeof test.category === 'string' &&
            typeof test.location === 'string' &&
            typeof test.pending === 'boolean' &&
            typeof test.note === 'string') ||
         test.note === null
      );
   } catch {
      return false;
   }
};

/* Type predicate for AllocationList */
export const isAllocationList = (val: unknown): val is AllocationList => {
   try {
      const test = val as AllocationList;
      return (
         typeof test.total === 'number' &&
         Array.isArray(test.allocations) &&
         test.allocations.every((t) => isAllocation(t)) &&
         test.total >= test.allocations.length
      );
   } catch {
      return false;
   }
};

/* Type predicate for AllocationList */
export const isCategorisation = (val: unknown): val is Categorisation => {
   try {
      const test = val as Categorisation;
      return (
         Array.isArray(test.categories) &&
         Array.isArray(test.locations) &&
         test.categories.every((t) => typeof t.name === 'string' && typeof t.score === 'number') &&
         test.locations.every((t) => typeof t.name === 'string' && typeof t.score === 'number')
      );
   } catch {
      return false;
   }
};

/* Type predicate for DashboardPanel */
export const isDashboardPanel = (val: unknown): val is DashboardPanel => {
   const test = val as DashboardPanel;
   return typeof test.category === 'string' && typeof test.amount === 'number' && typeof test.limit === 'number' && typeof test.diff === 'number';
};
