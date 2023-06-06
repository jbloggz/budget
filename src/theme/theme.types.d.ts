/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * theme.types.d.ts: This file contains the type definitions for the theme
 */

import { themes } from '.';

/* This is a type for the list of available themes */
export type themeType = (typeof themes)[number] | undefined;
