import { Scope, BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { FactoryProvider } from '@nestjs/common';
import type PrismaService from './prisma.service';

export default (
  name: string,
  _service: PrismaService<any>,
): FactoryProvider => ({
  provide: name,
  scope: Scope.REQUEST,
  useFactory: async (req: Request) => {
    return new Promise((resolve, reject) => {
      if (!req.headers.get('x-tenant-id')) {
        reject(new BadRequestException('⛔️ Invalid Request Options - Tenant'));
      } else {
        const connection = _service.getConnection(req.headers['x-tenant-id']);
        resolve(connection);
      }
    });
  },
  inject: [REQUEST],
});
