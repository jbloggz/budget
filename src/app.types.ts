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

/* A single transaction */
export interface Transaction {
   id?: number;
   date: string;
   amount: number;
   description: string;
   source: string;
}

/* A list of transactions */
export type TransactionList = {
   total: number;
   transactions: Transaction[];
};

/* An API request that is expected to response with T */
export interface APIRequest<T> {
   method: 'GET' | 'POST' | 'PUT' | 'DELETE';
   url: string;
   headers?: { [key: string]: string };
   body?: URLSearchParams | string;
   validate?: (data: unknown) => data is T;
}

/* An API response containing T */
export type APIResponse<T> = {
   code: number;
   data: T;
};

/* The credentials returned be the API for a successful login or token refresh */
export interface APIAuthTokens {
   access_token: string;
   refresh_token: string;
   token_type: 'bearer';
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

/* Type predicate for APIAuthTokens */
export const isAPIAuthTokens = (val: unknown): val is APIAuthTokens => {
   try {
      const test = val as APIAuthTokens;
      return typeof test.access_token === 'string' && typeof test.refresh_token === 'string' && test.token_type === 'bearer';
   } catch {
      return false;
   }
};

/* Type predicate for APITransaction */
export const isTransaction = (val: unknown): val is Transaction => {
   try {
      const test = val as Transaction;
      return (
         (typeof test.id === 'undefined' || typeof test.id === 'number') &&
         typeof test.date === 'string' &&
         typeof test.amount === 'number' &&
         typeof test.description === 'string' &&
         typeof test.source === 'string'
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
