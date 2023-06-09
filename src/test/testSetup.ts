/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * testSetup.ts: This file contains the setup code for vitest
 */

import matchers from '@testing-library/jest-dom/matchers';
import { afterEach, beforeEach, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/* This extents vitest's expect() to use jest-dom matchers */
expect.extend(matchers);

beforeEach(() => {
   /* We need to mock matchMedia for tests to work with responsiveness */
   Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
         matches: false,
         media: query,
         onchange: null,
         addListener: vi.fn(), // Deprecated
         removeListener: vi.fn(), // Deprecated
         addEventListener: vi.fn(),
         removeEventListener: vi.fn(),
         dispatchEvent: vi.fn(),
      })),
   });
});

afterEach(() => {
   /* Make sure test cleanup after they run */
   cleanup();
});
