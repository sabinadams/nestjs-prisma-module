import { FactoryProvider } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PrismaModule } from '../src/prisma.module';

vi.mock('../src/prisma.service.ts', () => {
  return {
    default: class {
      getConnection = vi.fn();
    },
  };
});

describe('prisma.module.ts', () => {
  it('Should return a dynamic module with the Prisma Service as a provider', () => {
    const dynamic_module = PrismaModule.register({
      client: null,
      datasource: 'file:./dev.db',
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
  });
});
