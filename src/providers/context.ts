/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * context.tsx: This file contains wrappers for reacts createContext/useContext which restrict their
 *              use to insize Provider, and also remove the need for a dummy default value.
 */

import React from 'react';

export const createContext = <T>() => {
   return React.createContext<T | undefined>(undefined) as React.Context<T>;
};

export const useContext = <T>(ctx: React.Context<T>) => {
   const reactCtx = React.useContext(ctx);
   if (!reactCtx) {
      throw new Error('useContext must be used within a Provider');
   }
   return reactCtx;
};
