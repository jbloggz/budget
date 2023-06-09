/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * testSetup.ts: This file contains the setup code for vitest
 */

import matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

/* This extents vitest's expect() to use jest-dom matchers */
expect.extend(matchers);
