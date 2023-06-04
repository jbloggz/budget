/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * theme.d.ts: This file contains the type definitions for the theme
 */

import { themes } from '.';

export type themeType = (typeof themes)[number] | undefined;

export interface themeContextType {
   theme: themeType;
   setTheme: (theme: themeType) => void;
}
