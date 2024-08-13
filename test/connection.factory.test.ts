import { vi, describe, expect, it, beforeEach } from 'vitest';
import factory from '../src/connection.factory';
import PrismaService from '../src/prisma.service';
import { REQUEST } from '@nestjs/core';
import { BadRequestException, Scope } from '@nestjs/common';
import PrismaMock from './helpers/PrismaMock';

describe('connection.factory.ts', () => {
  let provider;
  const fakeRequest = {
    headers: {
      'x-tenant-id': 'test',
      get() {
        return this;
      },
    },
  };
  const service = new PrismaService(
    PrismaMock,
    'file:./dev.db',
    { test: 1 },
    'test',
    true,
  );
  beforeEach(() => {
    provider = factory('TEST', true, 'HTTP', service);
  });

  it('Should return a Provider', () => {
    expect(provider.provide).toBe('TEST');
    expect(provider.scope).toBe(Scope.REQUEST);
    expect(provider.inject[0]).toBe(REQUEST);
    expect(provider).toHaveProperty('useFactory');
  });

  describe('Multitenancy', () => {
    it("Provider's `useFactory` should return a connection when valid tenant sent", async () => {
      // Mock the service response to avoid needing a connection
      const spy = vi.spyOn(service, 'getConnection');
      spy.mockImplementationOnce((tenant) => tenant);
      // Run the function
      const connection = await provider.useFactory(fakeRequest);
      expect(service.getConnection).toHaveBeenCalledWith('test');
      expect(connection).toBe('test');
    });

    it("Provider's `useFactory` should return a BadRequestException when no tenant sent", async () => {
      // Run the function
      await expect(
        provider.useFactory({
          headers: {
            get(name) {
              return this[name];
            },
          },
        }),
      ).rejects.toThrowError('⛔️ Invalid Request Options - Tenant');

      // Run the function
      await provider
        .useFactory({
          headers: {
            get(name) {
              return this[name];
            },
          },
        })
        .catch((e) => {
          expect(e).toBeInstanceOf(BadRequestException);
        });
    });
  });
  describe('Single Tenant', () => {
    let provider;
    const fakeRequest = {
      headers: {
        get(name) {
          return this[name];
        },
      },
    };
    const service = new PrismaService(
      PrismaMock,
      undefined,
      { test: 1 },
      'test',
    );
    beforeEach(() => {
      provider = factory('TEST', false, 'HTTP', service);
    });
    it('Should return a Provider', () => {
      expect(provider.provide).toBe('TEST');
      expect(provider.scope).toBe(Scope.REQUEST);
      expect(provider.inject[0]).toBe(REQUEST);
      expect(provider).toHaveProperty('useFactory');
    });
    it("Provider's `useFactory` should return a connection even with no tenant header", async () => {
      // Mock the service response to avoid needing a connection
      const spy = vi.spyOn(service, 'getConnection');
      spy.mockImplementationOnce((tenant) => tenant);
      // Run the function
      const connection = await provider.useFactory(fakeRequest);
      expect(service.getConnection).toHaveBeenCalledWith('DEFAULT');
      expect(connection).toBe('DEFAULT');
    });
    it("Provider's `useFactory` should return a connection named DEFAULT even tenant header sent", async () => {
      // Mock the service response to avoid needing a connection
      const spy = vi.spyOn(service, 'getConnection');
      spy.mockImplementationOnce((tenant) => tenant);
      // Run the function
      const connection = await provider.useFactory({
        headers: {
          'x-tenant-id': 'test-tenant',
          get(name) {
            return this[name];
          },
        },
      });
      expect(service.getConnection).toHaveBeenCalledWith('DEFAULT');
      expect(connection).toBe('DEFAULT');
    });
  });
});
