import { Scope, BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { FactoryProvider } from '@nestjs/common';
import type PrismaService from './prisma.service';
import type { ClassLike, PluginConfig } from './types';
import { RequestContext } from '@nestjs/microservices';

const resolveTenantConnection = (
  tenant: string | null,
  _service: PrismaService<ClassLike>,
) => {
  return new Promise((resolve, reject) => {
    if (!tenant) {
      reject(new BadRequestException('⛔️ Invalid Request Options - Tenant'));
    } else {
      const connection = _service.getConnection(tenant);
      resolve(connection);
    }
  });
};

const multiTenantHTTPFactory =
  (_service: PrismaService<ClassLike>) =>
  async (req: Request | RequestContext) => {
    let tenantId = null;
    if ((req as Request).headers['x-tenant-id']) {
      tenantId = (req as Request).headers['x-tenant-id'];
    }
    return await resolveTenantConnection(tenantId, _service);
  };

const multiTenantGRPCFactory =
  (_service: PrismaService<ClassLike>) =>
  async (req: Request | RequestContext) => {
    let tenantId = null;
    if ((req as RequestContext).context.internalRepr.has('x-tenant-id')) {
      tenantId = (req as RequestContext).context.internalRepr.has(
        'x-tenant-id',
      )[0];
    }
    return await resolveTenantConnection(tenantId, _service);
  };

const genericFactory = (_service: PrismaService<ClassLike>) => async () => {
  return await resolveTenantConnection('DEFAULT', _service);
};

const getFactory = (
  multitenancy: boolean,
  requestType: PluginConfig<ClassLike>['requestType'],
  _service: PrismaService<ClassLike>,
) => {
  if (!multitenancy) return genericFactory(_service);
  if (requestType === 'HTTP') {
    return multiTenantHTTPFactory(_service);
  } else if (requestType === 'GRPC') {
    return multiTenantGRPCFactory(_service);
  } else {
    throw new BadRequestException('⛔️ Unhandled request type');
  }
};

export default (
  name: string,
  multitenancy: boolean,
  requestType: PluginConfig<ClassLike>['requestType'],
  _service: PrismaService<ClassLike>,
): FactoryProvider => ({
  provide: name,
  scope: multitenancy ? Scope.REQUEST : Scope.DEFAULT,
  useFactory: getFactory(multitenancy, requestType, _service),
  inject: multitenancy ? [REQUEST] : [],
});
