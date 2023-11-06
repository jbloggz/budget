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
import { APIProvider } from '@jbloggz/use-api';
import { EditAllocationModal } from '.';


describe('EditAllocationModal', () => {
   it('Wont render an EditAllocationModal if isOpen is false', () => {
      const { container } = render(
         <MemoryRouter>
            <APIProvider>
               <EditAllocationModal isOpen={false} id={''} onClose={vi.fn} onSave={vi.fn} />
            </APIProvider>
         </MemoryRouter>
      );
      const elem = container.querySelector('input');
      expect(elem).not.toBeInTheDocument();
   });
});
