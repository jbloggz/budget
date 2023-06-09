/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * context.types.d.ts: This file contains the type definitions for the contexts
 */

export interface credentialsType {
   email: string;
   password: string;
   remember: boolean;
}
export interface themeContextType {
   theme: themeType;
   setTheme: (theme: themeType) => void;
}

export interface authContextType {
   login: (creds: credentialsType) => boolean;
   logout: () => void;
}
