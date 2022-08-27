import { vi, describe, expect, it } from 'vitest';
import factory from '../src/connection.factory';
import PrismaService from '../src/prisma.service';
import { REQUEST } from '@nestjs/core';
import { BadRequestException, Scope } from '@nestjs/common';
import { Request } from 'node-fetch';

const service = new PrismaService(null, 'file:./dev.db', { test: 1 }, 'test');
const provider = factory('TEST', service);

describe('connection.factory.ts', () => {
  it('Should return a Provider', () => {
    expect(provider.provide).toBe('TEST');
    expect(provider.scope).toBe(Scope.REQUEST);
    expect(provider.inject[0]).toBe(REQUEST);
    expect(provider).toHaveProperty('useFactory');
  });

  it("Provider's `useFactory` should return a connection when valid tenant sent", async () => {
    // Mock the request
    const request = new Request('http://www.google.com');
    // Add the required header
    request.headers.append('x-tenant-id', 'test');
    // Mock the service response to avoid needing a connection
    const spy = vi.spyOn(service, 'getConnection');
    spy.mockImplementationOnce(() => 'test-connection');
    // Run the function
    const connection = await provider.useFactory(request);

    expect(connection).toBe('test-connection');
  });

  it("Provider's `useFactory` should return a BadRequestException when no", async () => {
    // Mock the request
    const request = new Request('http://www.google.com');

    // Run the function
    await expect(provider.useFactory(request)).rejects.toThrowError(
      '⛔️ Invalid Request Options - Tenant',
    );

    // Run the function
    await provider.useFactory(request).catch((e) => {
      expect(e).toBeInstanceOf(BadRequestException);
    });
  });
});
