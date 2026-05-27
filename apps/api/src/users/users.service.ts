import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  list(filters?: { role?: Role; programId?: string }) {
    return this.prisma.user.findMany({
      where: {
        ...(filters?.role ? { role: filters.role } : {}),
        ...(filters?.programId ? { programId: filters.programId } : {}),
      },
      select: { id: true, email: true, name: true, role: true, programId: true },
      orderBy: { name: 'asc' },
    });
  }
}
