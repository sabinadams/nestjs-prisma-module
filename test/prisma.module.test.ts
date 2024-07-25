import { FactoryProvider } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PrismaModule } from '../src/prisma.module';
import PrismaMock from './helpers/PrismaMock';

vi.mock('../src/prisma.service.ts', () => {
  return {
    default: class {
      getConnection = vi.fn(() => new PrismaMock({}));
    },
  };
});

describe('prisma.module.ts', () => {
  describe('Options', () => {
    it('Should set the provider to global if specified', async () => {
      const dynamic_module_global = PrismaModule.register({
        client: PrismaMock,
        name: 'TEST',
        global: true,
      });

      const dynamic_module = PrismaModule.register({
        client: PrismaMock,
        name: 'TEST',
      });

      expect(dynamic_module_global.global).toBe(true);
      expect(dynamic_module.global).toBe(false);
    });
  });

  describe('Multitenancy', () => {
    it('Class Only: Should return a dynamic module with the Prisma Service as a provider', async () => {
      const dynamic_module = PrismaModule.register({
        client: PrismaMock,
        datasource: 'file:./dev.db',
        multitenancy: true,
        name: 'TEST',
      });

      // Make sure a provider is returned
      expect(dynamic_module.providers.length).toBe(1);
      // Make sure the provider one of the factory providers
      expect(dynamic_module.providers[0]).toHaveProperty('useFactory');
      // Make sure the module exports the provider
      expect(dynamic_module.exports.length).toBe(1);
      // Make sure the same provider is being set as a provider and an export
      expect(dynamic_module.exports).toStrictEqual(dynamic_module.providers);
      // Make sure the factory provider is provided the correct name
      const factory_provider: FactoryProvider = dynamic_module
        .providers[0] as FactoryProvider;
      expect(factory_provider.provide).toBe('TEST');

      const connection = await factory_provider.useFactory({
        headers: {
          'x-tenant-id': 'test-tenant',
          get() {
            return this;
          },
        },
      });
      expect(connection).toBeInstanceOf(PrismaMock);
    });

    it('With Initializer: Should return a dynamic module with the Prisma Service as a provider', async () => {
      const dynamic_module = PrismaModule.register({
        client: {
          class: PrismaMock,
          initializer: (client, _) => {
            return client;
          },
        },
        datasource: 'file:./dev.db',
        multitenancy: true,
        name: 'TEST',
      });

      // Make sure a provider is returned
      expect(dynamic_module.providers.length).toBe(1);
      // Make sure the provider one of the factory providers
      expect(dynamic_module.providers[0]).toHaveProperty('useFactory');
      // Make sure the module exports the provider
      expect(dynamic_module.exports.length).toBe(1);
      // Make sure the same provider is being set as a provider and an export
      expect(dynamic_module.exports).toStrictEqual(dynamic_module.providers);
      // Make sure the factory provider is provided the correct name
      const factory_provider: FactoryProvider = dynamic_module
        .providers[0] as FactoryProvider;
      expect(factory_provider.provide).toBe('TEST');

      const connection = await factory_provider.useFactory({
        headers: {
          'x-tenant-id': 'test-tenant',
          get() {
            return this;
          },
        },
      });
      expect(connection).toBeInstanceOf(PrismaMock);
    });
  });

  describe('Single Tenant', () => {
    it('Class Only: Should return a dynamic module with the Prisma Service as a provider', async () => {
      const dynamic_module = PrismaModule.register({
        client: PrismaMock,
        name: 'TEST',
      });

      // Make sure a provider is returned
      expect(dynamic_module.providers.length).toBe(1);
      // Make sure the provider one of the factory providers
      expect(dynamic_module.providers[0]).toHaveProperty('useFactory');
      // Make sure the module exports the provider
      expect(dynamic_module.exports.length).toBe(1);
      // Make sure the same provider is being set as a provider and an export
      expect(dynamic_module.exports).toStrictEqual(dynamic_module.providers);
      // Make sure the factory provider is provided the correct name
      const factory_provider: FactoryProvider = dynamic_module
        .providers[0] as FactoryProvider;
      expect(factory_provider.provide).toBe('TEST');

      const connection = await factory_provider.useFactory({
        headers: {
          get() {
            return this;
          },
        },
      });
      expect(connection).toBeInstanceOf(PrismaMock);
    });

    it('With Initializer: Should return a dynamic module with the Prisma Service as a provider', async () => {
      const dynamic_module = PrismaModule.register({
        client: {
          class: PrismaMock,
          initializer: (client, _) => {
            return client;
          },
        },
        name: 'TEST',
      });

      // Make sure a provider is returned
      expect(dynamic_module.providers.length).toBe(1);
      // Make sure the provider one of the factory providers
      expect(dynamic_module.providers[0]).toHaveProperty('useFactory');
      // Make sure the module exports the provider
      expect(dynamic_module.exports.length).toBe(1);
      // Make sure the same provider is being set as a provider and an export
      expect(dynamic_module.exports).toStrictEqual(dynamic_module.providers);
      // Make sure the factory provider is provided the correct name
      const factory_provider: FactoryProvider = dynamic_module
        .providers[0] as FactoryProvider;
      expect(factory_provider.provide).toBe('TEST');

      const connection = await factory_provider.useFactory({
        headers: {
          get() {
            return this;
          },
        },
      });
      expect(connection).toBeInstanceOf(PrismaMock);
    });
  });
});
