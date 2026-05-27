import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query('role') role?: Role, @Query('programId') programId?: string) {
    return this.users.list({ role, programId });
  }
}
