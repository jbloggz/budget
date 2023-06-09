/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * ErrorPage.test.tsx: This file contains the tests for the ErrorPage page
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { ErrorPage } from '.';

describe('ErrorPage', () => {
   it('renders the error page', () => {
      const routes = [
         {
            path: '/',
            element: <ErrorPage />,
         },
      ];
      const router = createMemoryRouter(routes, {
         initialEntries: ['/'],
         initialIndex: 1,
      });
      render(<RouterProvider router={router} />);
      const msg = screen.getByText('Oops! Something has gone wrong.');
      expect(msg).toBeInTheDocument();
   });
});
