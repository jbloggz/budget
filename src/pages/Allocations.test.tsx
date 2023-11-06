/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * Allocations.test.tsx: This file contains the tests for the Allocations page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { APIProvider } from '@jbloggz/use-api';
import { mockResizeObserver } from '../mocks';
import { Theme } from '../app.types';
import { ThemeProvider } from '../providers';
import { Allocations } from '.';


describe('Allocations', () => {
   beforeEach(() => {
      mockResizeObserver.reset();
   });

   it('renders the allocations page', () => {
      const theme: Theme = 'dark';
      const setTheme = vi.fn();
      render(
         <MemoryRouter>
            <ChakraProvider>
               <ThemeProvider theme={theme} setTheme={setTheme}>
                  <APIProvider>
                     <Allocations />
                  </APIProvider>
               </ThemeProvider>
            </ChakraProvider>
         </MemoryRouter>
      );
      const title = screen.getByText('Allocations');
      expect(title).toBeInTheDocument();
   });
});
