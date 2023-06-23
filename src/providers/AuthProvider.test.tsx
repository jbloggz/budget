/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * AuthProvider.test.tsx: This file contains the tests for the AuthProvider
 */

import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { mockFetch } from '../mocks';
import { AuthProvider } from '.';

const TestingComponent = () => {
   return <p>Logged in</p>;
};

describe('AuthProvider', () => {
   beforeEach(() => {
      mockFetch.reset();
      mockFetch.setJSONResponse({ detail: 'Invalid/expired access token' }, 401);
   });

   it('can render the AuthProvider', () => {
      render(
         <MemoryRouter>
            <AuthProvider></AuthProvider>
         </MemoryRouter>
      );
   });

   it('is not logged in initially', async () => {
      render(
         <MemoryRouter>
            <AuthProvider>
               <TestingComponent />
            </AuthProvider>
         </MemoryRouter>
      );
      await waitFor(() => expect(screen.getByText('Sign in').textContent).toBe('Sign in'));
      const btn = screen.queryByText('Sign in');
      expect(btn).toBeInTheDocument();
   });

   it('is logged in initially with valid token', async () => {
      localStorage.setItem('access_token', '"valid_access_token"');
      localStorage.setItem('refresh_token', '"valid_refresh_token"');
      mockFetch.setResponseIf(
         (req) => req.method === 'GET' && req.url === '/api/oauth2/token/' && req.headers.Authorization === 'Bearer valid_access_token',
         '',
         204
      );
      render(
         <MemoryRouter>
            <AuthProvider>
               <TestingComponent />
            </AuthProvider>
         </MemoryRouter>
      );

      await waitFor(() => expect(screen.getByText('Logged in').textContent).toBe('Logged in'));
      const btn = screen.queryByText('Sign in');
      expect(btn).not.toBeInTheDocument();
   });

   it('is logged in initially with valid refresh token', async () => {
      mockFetch.setJSONResponse({ detail: 'Invalid/expired access token' }, 401);
      mockFetch.setJSONResponseIf(
         (req) => {
            const params = new URLSearchParams(req.body || '');
            return (
               req.method === 'POST' &&
               params.get('refresh_token') === 'valid_refresh_token' &&
               params.get('grant_type') === 'refresh_token' &&
               req.headers['Content-Type'] === 'application/x-www-form-urlencoded'
            );
         },
         { access_token: 'valid_access_token', refresh_token: 'valid_refresh_token2', token_type: 'bearer' }
      );
      mockFetch.setResponseIf(
         (req) => req.method === 'GET' && req.url === '/api/oauth2/token/' && req.headers.Authorization === 'Bearer valid_access_token',
         '',
         204
      );

      localStorage.setItem('access_token', '"bad_access_token"');
      localStorage.setItem('refresh_token', '"valid_refresh_token"');

      render(
         <MemoryRouter>
            <AuthProvider>
               <TestingComponent />
            </AuthProvider>
         </MemoryRouter>
      );

      await waitFor(() => expect(screen.getByText('Logged in').textContent).toBe('Logged in'));
      const btn = screen.queryByText('Sign in');
      expect(btn).not.toBeInTheDocument();
   });
});
