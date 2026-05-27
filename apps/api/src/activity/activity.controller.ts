import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('activity')
export class ActivityController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@Query('limit') limit?: string) {
    const take = Math.min(Number(limit) || 30, 100);
    return this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: { user: { select: { id: true, name: true } } },
    });
  }
}
