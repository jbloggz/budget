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

export const urlB64ToUint8Array = (base64String: string) => {
   const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
   const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
   const rawData = atob(base64);
   const outputArray = new Uint8Array(rawData.length);
   for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
   }
   return outputArray;
};
