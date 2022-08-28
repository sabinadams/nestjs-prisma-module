import { Module, DynamicModule } from '@nestjs/common';
import factory from './connection.factory';
import PrismaService from './prisma.service';
import type { ClassLike, PluginConfig } from './types';

@Module({})
export class PrismaModule {
  static register<T extends ClassLike>(
    options: PluginConfig<T>,
  ): DynamicModule {
    const provider = factory(
      options.name,
      options.multitenancy,
      new PrismaService(
        options.client,
        options.datasource,
        options.options,
        options.name,
        options.multitenancy,
        options.logging,
      ),
    );
    return {
      module: PrismaModule,
      providers: [provider],
      exports: [provider],
    };
  }
}
