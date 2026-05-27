import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { title: string; message: string; userId?: string; type?: string; advanceId?: string }) {
    return this.prisma.notification.create({ data: { ...data, type: data.type ?? 'info' } });
  }

  async list(userId?: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { ...(userId ? { userId } : {}), ...(unreadOnly ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }
}
