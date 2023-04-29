import { Scope, BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { FactoryProvider } from '@nestjs/common';
import type PrismaService from './prisma.service';
import type { ClassLike } from './types';

export default (
  name: string,
  multitenancy: boolean,
  _service: PrismaService<ClassLike>,
): FactoryProvider => ({
  provide: name,
  scope: Scope.REQUEST,
  useFactory: async (req: Request) => {
    return new Promise((resolve, reject) => {
      if (!req.headers['x-tenant-id'] && multitenancy) {
        reject(new BadRequestException('⛔️ Invalid Request Options - Tenant'));
      } else {
        const connection = _service.getConnection(
          multitenancy ? req.headers['x-tenant-id'] : 'DEFAULT',
        );
        resolve(connection);
      }
    });
  },
  inject: [REQUEST],
});
