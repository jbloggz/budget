/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * EditAllocation.test.tsx: This file contains the tests for the EditAllocation page
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { APIProvider } from '@jbloggz/use-api';
import { EditAllocation } from '.';


describe('EditAllocation', () => {
   it('Wont render an EditAllocation if the allocation is null', () => {
      const { container } = render(
         <MemoryRouter>
            <APIProvider>
               <EditAllocation />
            </APIProvider>
         </MemoryRouter>
      );
      const elem = container.querySelector('input');
      expect(elem).not.toBeInTheDocument();
   });
});
