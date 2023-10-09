/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * mockResizeObserver.ts: This file contains the mock for ResizeObserver
 */

import { vi } from 'vitest';

class MockResizeObserver {
   /* Private variables */
   #actual = globalThis.ResizeObserver;
   #enabled = false;

   reset() {
      this.disable();
      this.enable();
   }

   isEnabled() {
      return this.#enabled;
   }

   enable() {
      if (!this.#enabled) {
         this.#enabled = true;
         globalThis.ResizeObserver = vi.fn(() => ({
            observe: vi.fn(),
            unobserve: vi.fn(),
            disconnect: vi.fn(),
         }));
      }
   }

   disable() {
      if (this.#enabled) {
         this.#enabled = false;
         globalThis.ResizeObserver = this.#actual as typeof ResizeObserver;
      }
   }
}

export const mockResizeObserver = new MockResizeObserver();
