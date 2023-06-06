/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * context.types.d.ts: This file contains the type definitions for the contexts
 */

export interface themeContextType {
   theme: themeType;
   setTheme: (theme: themeType) => void;
}

export interface authContextType {
   logout: () => void;
   login: () => void;
}
