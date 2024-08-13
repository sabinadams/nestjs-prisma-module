import { Scope, BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { FactoryProvider } from '@nestjs/common';
import type PrismaService from './prisma.service';
import type { ClassLike, PluginConfig } from './types';
import { RequestContext } from '@nestjs/microservices';

const resolveTenantConnection = (
  tenant: string | null,
  multitenancy: boolean,
  _service: PrismaService<ClassLike>,
) => {
  return new Promise((resolve, reject) => {
    if (!tenant && multitenancy) {
      reject(new BadRequestException('⛔️ Invalid Request Options - Tenant'));
    } else {
      let tenantName = 'DEFAULT';
      if (tenant && multitenancy) {
        tenantName = tenant;
      }
      const connection = _service.getConnection(tenantName);
      resolve(connection);
    }
  });
};

export default (
  name: string,
  multitenancy: boolean,
  requestType: PluginConfig<ClassLike>['requestType'],
  _service: PrismaService<ClassLike>,
): FactoryProvider => ({
  provide: name,
  scope: Scope.REQUEST,
  useFactory: async (req: Request | RequestContext) => {
    let tenantId = null;

    switch (requestType) {
      case 'HTTP':
        if ((req as Request).headers['x-tenant-id']) {
          tenantId = (req as Request).headers['x-tenant-id'];
        }
        return await resolveTenantConnection(tenantId, multitenancy, _service);
      case 'GRPC':
        if ((req as RequestContext).context.internalRepr.has('x-tenant-id')) {
          tenantId = (req as RequestContext).context.internalRepr.has(
            'x-tenant-id',
          )[0];
        }
        return await resolveTenantConnection(tenantId, multitenancy, _service);
    }
  },
  inject: [REQUEST],
});
