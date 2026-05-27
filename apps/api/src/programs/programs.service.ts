import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgramsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.program.findMany({
      include: { _count: { select: { templates: true, advances: true } } },
    });
  }

  findOne(id: string) {
    return this.prisma.program.findUnique({
      where: { id },
      include: { templates: true },
    });
  }
}
