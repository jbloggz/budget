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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import jwtEncode from 'jwt-encode';
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
      const queryClient = new QueryClient();
      render(
         <QueryClientProvider client={queryClient}>
            <MemoryRouter>
               <AuthProvider></AuthProvider>
            </MemoryRouter>
         </QueryClientProvider>
      );
   });

   it('is not logged in initially', async () => {
      const queryClient = new QueryClient();
      render(
         <QueryClientProvider client={queryClient}>
            <MemoryRouter>
               <AuthProvider>
                  <TestingComponent />
               </AuthProvider>
            </MemoryRouter>
         </QueryClientProvider>
      );
      await waitFor(() => expect(screen.getByText('Sign in').textContent).toBe('Sign in'));
      const btn = screen.queryByText('Sign in');
      expect(btn).toBeInTheDocument();
   });

   it('is logged in initially with valid token', async () => {
      const queryClient = new QueryClient();
      const now = Math.floor(Date.now() / 1000);
      const accessToken = jwtEncode({ sub: 'joe@example.com', iat: now - 300, exp: now + 300 }, 'secret');
      const refreshToken = jwtEncode({ sub: 'joe@example.com', iat: now - 300, exp: now + 3000 }, 'secret');
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      mockFetch.setResponseIf(
         (req) => req.method === 'GET' && req.url === '/api/oauth2/token/' && req.headers.Authorization === 'Bearer ' + accessToken,
         '',
         204
      );
      render(
         <QueryClientProvider client={queryClient}>
            <MemoryRouter>
               <AuthProvider>
                  <TestingComponent />
               </AuthProvider>
            </MemoryRouter>
         </QueryClientProvider>
      );

      await waitFor(() => expect(screen.getByText('Logged in').textContent).toBe('Logged in'));
      const btn = screen.queryByText('Sign in');
      expect(btn).not.toBeInTheDocument();
   });

   it('is logged in initially with valid refresh token', async () => {
      const queryClient = new QueryClient();
      const now = Math.floor(Date.now() / 1000);
      const oldAccessToken = jwtEncode({ sub: 'joe@example.com', iat: now - 600, exp: now - 300 }, 'secret');
      const oldRefreshToken = jwtEncode({ sub: 'joe@example.com', iat: now - 600, exp: now + 3000 }, 'secret');
      const newAccessToken = jwtEncode({ sub: 'joe@example.com', iat: now, exp: now + 300 }, 'secret');
      const newRefreshToken = jwtEncode({ sub: 'joe@example.com', iat: now, exp: now + 3000 }, 'secret');
      localStorage.setItem('access_token', oldAccessToken);
      localStorage.setItem('refresh_token', oldRefreshToken);

      mockFetch.setJSONResponse({ detail: 'Invalid/expired access token' }, 401);
      mockFetch.setJSONResponseIf(
         (req) => {
            const params = new URLSearchParams(req.body || '');
            return (
               req.method === 'POST' &&
               params.get('refresh_token') === oldRefreshToken &&
               params.get('grant_type') === 'refresh_token' &&
               req.headers['Content-Type'] === 'application/x-www-form-urlencoded'
            );
         },
         { access_token: newAccessToken, refresh_token: newRefreshToken, token_type: 'bearer' }
      );
      mockFetch.setResponseIf(
         (req) => req.method === 'GET' && req.url === '/api/oauth2/token/' && req.headers.Authorization === 'Bearer ' + newAccessToken,
         '',
         204
      );

      render(
         <QueryClientProvider client={queryClient}>
            <MemoryRouter>
               <AuthProvider>
                  <TestingComponent />
               </AuthProvider>
            </MemoryRouter>
         </QueryClientProvider>
      );

      await waitFor(() => expect(screen.getByText('Logged in').textContent).toBe('Logged in'));
      const btn = screen.queryByText('Sign in');
      expect(btn).not.toBeInTheDocument();
   });
});
