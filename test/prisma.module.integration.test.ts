import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { UserController } from './helpers/user.controller';
import { PrismaModule } from '../src/prisma.module';
import { ContextIdFactory } from '@nestjs/core';
import PrismaMock from './helpers/PrismaMock';

describe('Integration Tests', () => {
  describe('With Initializer', () => {
    let userController: UserController;
    const $initializerTest = vi.fn((tenant: string) => tenant);
    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [UserController],
        imports: [
          PrismaModule.register({
            client: {
              class: PrismaMock,
              initializer: (client, tenant) => {
                $initializerTest(tenant);
                return client;
              },
            },
            datasource: 'file:./dev.db',
            name: 'USERS',
          }),
        ],
      }).compile();

      const contextId = ContextIdFactory.create();
      moduleRef.registerRequestByContextId(
        {
          headers: {
            'x-tenant-id': 'test-tenant',
            get() {
              return this;
            },
          },
        },
        contextId,
      );
      userController = await moduleRef.resolve<UserController>(
        UserController,
        contextId,
      );
    });

    it('Should register a usable Prisma service', async () => {
      await userController.getUserCount();
      expect(userController.users).toBeInstanceOf(PrismaMock);
      expect(userController.users.user.count).toBeCalled();
      expect(userController.users.user.count).toHaveReturnedWith(1);
      expect($initializerTest).toHaveBeenCalledWith('test-tenant');
    });
  });
  describe('Class Only', () => {
    let userController: UserController;
    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [UserController],
        imports: [
          PrismaModule.register({
            client: PrismaMock,
            datasource: 'file:./dev.db',
            name: 'USERS',
          }),
        ],
      }).compile();

      const contextId = ContextIdFactory.create();
      moduleRef.registerRequestByContextId(
        {
          headers: {
            'x-tenant-id': 'test-tenant',
            get() {
              return this;
            },
          },
        },
        contextId,
      );
      userController = await moduleRef.resolve<UserController>(
        UserController,
        contextId,
      );
    });

    it('Should register a usable Prisma service', async () => {
      await userController.getUserCount();
      expect(userController.users).toBeInstanceOf(PrismaMock);
      expect(userController.users.user.count).toBeCalled();
      expect(userController.users.user.count).toHaveReturnedWith(1);
    });
  });
});
