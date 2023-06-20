/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * util.ts: This file contians any utility functions used in the app
 */

import { apiTokenType } from './hooks';

/**
 * Type predicate for a non-empty string
 *
 * @param val  any value
 *
 * @returns whether 'val' is a non-empty string
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const isNonEmptyString = (val: any): val is string => {
   return typeof val === 'string' && val !== '';
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export const isApiTokenType = (val: any): val is apiTokenType => {
   try {
      return typeof val.access_token === 'string' && typeof val.refresh_token === 'string' && val.token_type === 'bearer';
   } catch {
      return false;
   }
};
