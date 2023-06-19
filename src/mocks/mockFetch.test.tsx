/**
 * MIT License
 *
 * Copyright (c) 2023 Josef Barnes
 *
 * mockFetch.test.tsx: This file contains the tests for mockFetch
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch } from '.';

describe('mockFetch', () => {
   beforeEach(() => {
      mockFetch.reset();
      mockFetch.disable();
   });

   it('is not mocked by default', () => {
      expect(globalThis.fetch).not.toBeDefined();
   });

   it('can be enabled', () => {
      expect(globalThis.fetch).not.toBeDefined();
      mockFetch.enable();
      expect(fetch).toBeDefined();
      expect(fetch).toBeInstanceOf(Object);
   });

   it('can be disabled', () => {
      expect(globalThis.fetch).not.toBeDefined();
      mockFetch.enable();
      expect(fetch).toBeDefined();
      expect(fetch).toBeInstanceOf(Object);
      mockFetch.disable();
      expect(globalThis.fetch).not.toBeDefined();
   });

   it('can set basic unconditional response', async () => {
      mockFetch.enable();
      mockFetch.setResponse({ hello: 'world' });
      const resp = await fetch('/foo');
      expect(resp.ok).toBe(true);
      expect(resp.status).toBe(200);
      expect(resp.url).toBe('/foo');
      expect(resp.statusText).toBe('OK');
      expect(resp.type).toBe('basic');
   });

   it('can get basic unconditional response repeated', async () => {
      mockFetch.enable();
      mockFetch.setResponse({ hello: 'world' });
      await fetch('/bar');
      const resp = await fetch('/bar');
      expect(resp.ok).toBe(true);
      expect(resp.status).toBe(200);
      expect(resp.url).toBe('/bar');
      expect(resp.statusText).toBe('OK');
      expect(resp.type).toBe('basic');
      expect(await resp.json()).toStrictEqual({ hello: 'world' });
      expect(await resp.text()).toBe('{"hello":"world"}');
   });

   it('can reset calls', async () => {
      mockFetch.enable();
      mockFetch.setResponse({ hello: 'world' });
      await fetch('/bar');
      expect(mockFetch.calls.length).toBeGreaterThan(0);
      mockFetch.reset();
      expect(mockFetch.calls.length).toBe(0);
   });

   it('can get call info', async () => {
      mockFetch.enable();
      mockFetch.setResponse({ hello: 'world' });
      expect(mockFetch.calls.length).toBe(0);
      await fetch('/bar');
      expect(mockFetch.calls.length).toBe(1);
      expect(mockFetch.calls[0].request.url).toBe('/bar');
      expect(mockFetch.calls[0].request.method).toBe('GET');
      expect(mockFetch.calls[0].request.headers).toStrictEqual({});
      expect(mockFetch.calls[0].request.body).toBeNull();
      expect(mockFetch.calls[0].response.body).toStrictEqual({ hello: 'world' });
      expect(mockFetch.calls[0].response.headers).toStrictEqual({ 'Content-Type': 'application/json' });
      expect(mockFetch.calls[0].response.status).toBe(200);
   });

   it('can set unconditional response with headers and status', async () => {
      mockFetch.enable();
      mockFetch.setResponse({ create: 'something' }, 201, { foo: 'bar' });
      const resp = await fetch('/qwerty', { method: 'POST', body: JSON.stringify([1, 2, 3]), headers: { asdf: 'foobar' } });
      expect(resp.ok).toBe(true);
      expect(resp.status).toBe(201);
      expect(resp.url).toBe('/qwerty');
      expect(resp.statusText).toBe('Created');
      expect(resp.type).toBe('basic');
      expect(await resp.json()).toStrictEqual({ create: 'something' });
      expect(mockFetch.calls.length).toBe(1);
      expect(mockFetch.calls[0].request.url).toBe('/qwerty');
      expect(mockFetch.calls[0].request.method).toBe('POST');
      expect(mockFetch.calls[0].request.headers).toStrictEqual({ asdf: 'foobar' });
      expect(mockFetch.calls[0].request.body).toStrictEqual([1, 2, 3]);
      expect(mockFetch.calls[0].response.body).toStrictEqual({ create: 'something' });
      expect(mockFetch.calls[0].response.headers).toStrictEqual({ 'Content-Type': 'application/json', foo: 'bar' });
      expect(mockFetch.calls[0].response.status).toBe(201);
   });

   it('can run multiple calls', async () => {
      mockFetch.enable();
      mockFetch.setResponse({ hey: 'jude' });
      await fetch('/fiz');
      await fetch('/buz');
      await fetch('/fis/buz');
      await fetch('/foo');
      await fetch('/bar');
      await fetch('/foo/bar');
      expect(mockFetch.calls.length).toBe(6);
      expect(mockFetch.calls[0].request.url).toBe('/fiz');
      expect(mockFetch.calls[1].request.url).toBe('/buz');
      expect(mockFetch.calls[2].request.url).toBe('/fis/buz');
      expect(mockFetch.calls[3].request.url).toBe('/foo');
      expect(mockFetch.calls[4].request.url).toBe('/bar');
      expect(mockFetch.calls[5].request.url).toBe('/foo/bar');
      mockFetch.reset();
      expect(mockFetch.calls.length).toBe(0);
   });

   it('can set unconditional failure', async () => {
      mockFetch.enable();
      mockFetch.setFailure('Oops I did it again');
      expect(fetch('/fiz')).rejects.toThrow('Oops I did it again');
   });

   it('sets failure by default', async () => {
      mockFetch.enable();
      expect(fetch('/butford')).rejects.toThrow('No response implemented');
   });
});
