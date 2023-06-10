/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * util.ts: This file contians any utility functions used in the app
 */

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
