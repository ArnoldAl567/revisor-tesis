import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async log(type: string, message: string, opts?: { userId?: string; advanceId?: string; metadata?: Prisma.InputJsonValue }) {
    return this.prisma.activityLog.create({
      data: { type, message, userId: opts?.userId, advanceId: opts?.advanceId, metadata: opts?.metadata },
    });
  }

  async recent(limit = 20) {
    return this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
