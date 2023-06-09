/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * router.tsx: This file contains the routes for the app
 */

import { createBrowserRouter } from 'react-router-dom';
import { App } from './components';
import { Allocations, Dashboard, ErrorPage, Settings, Transactions } from './pages';

const router = createBrowserRouter([
   {
      path: '/',
      element: <App />,
      errorElement: <ErrorPage />,
      children: [
         {
            index: true,
            element: <Dashboard />,
         },
         {
            path: '/allocations',
            element: <Allocations />,
         },
         {
            path: '/transactions',
            element: <Transactions />,
         },
         {
            path: '/settings',
            element: <Settings />,
         },
      ],
   },
]);

export default router;
