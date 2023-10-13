/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * utils.ts: This file contains utility functions to be used across the app
 */

export const prettyAmount = (amount: number): string => {
   return (amount / 100).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
};

export const prettyDate = (date: string) => {
   return new Date(date).toLocaleDateString();
};
