import { Controller, Get, Inject } from '@nestjs/common';
import PrismaMock from './PrismaMock';
@Controller()
export class UserController {
  constructor(@Inject('USERS') public users: PrismaMock) {}

  @Get()
  async getUserCount(): Promise<number> {
    return this.users.user.count();
  }
}
