/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * EditAllocation.test.tsx: This file contains the tests for the EditAllocation page
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditAllocationModal } from '.';

const queryClient = new QueryClient();

describe('EditAllocationModal', () => {
   it('Wont render an EditAllocationModal if isOpen is false', () => {
      const { container } = render(
         <MemoryRouter>
            <QueryClientProvider client={queryClient}>
               <EditAllocationModal isOpen={false} id={''} onClose={vi.fn} onSave={vi.fn} />
            </QueryClientProvider>
         </MemoryRouter>
      );
      const elem = container.querySelector('input');
      expect(elem).not.toBeInTheDocument();
   });
});
