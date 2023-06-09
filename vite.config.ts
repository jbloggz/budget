/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * vite.config.ts: This file provides the configuration for vite
 */

/// <reference types="vitest" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
   plugins: [react()],
   test: {
      coverage: {
         provider: 'v8',
         all: true,
      },
      environment: 'jsdom',
      setupFiles: './src/testSetup.ts',
    },
});
