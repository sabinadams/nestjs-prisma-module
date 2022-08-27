import { beforeEach, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import { UserController } from './helpers/user.controller';
import { PrismaModule } from '../src/prisma.module';
import { ContextIdFactory } from '@nestjs/core';
import PrismaMock from './helpers/PrismaMock';

describe('Prisma Module: Integration', () => {
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
          'x-tenant-id': 'test',
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
    const count = await userController.getUserCount();
    expect(userController.users).toBeInstanceOf(PrismaMock);
    expect(userController.users.user.count).toBeCalled();
    expect(userController.users.user.count).toHaveReturnedWith(1);
  });
});
