import { BadRequestException, Injectable } from '@nestjs/common';
import { AdvanceStatus, Prisma, ReviewStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
    private notifications: NotificationsService,
  ) {}

  list(filters?: { status?: AdvanceStatus; programId?: string }) {
    return this.prisma.advance.findMany({
      where: {
        ...(filters?.programId ? { programId: filters.programId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        aiAnalysis: { isNot: null },
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        program: true,
        template: true,
        aiAnalysis: true,
        review: { include: { reviewer: { select: { id: true, name: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findOne(advanceId: string) {
    return this.prisma.advance.findUnique({
      where: { id: advanceId },
      include: {
        student: true,
        program: true,
        template: true,
        aiAnalysis: true,
        review: { include: { reviewer: true } },
        annotations: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async upsertReview(
    advanceId: string,
    body: {
      reviewerId: string;
      finalGrade?: number;
      humanComment?: string;
      findingDecisions?: unknown;
      checklist?: unknown;
      status?: ReviewStatus;
      advanceStatus?: AdvanceStatus;
    },
  ) {
    const advance = await this.prisma.advance.findUnique({ where: { id: advanceId } });
    if (!advance) throw new BadRequestException('Avance no encontrado');

    const review = await this.prisma.review.upsert({
      where: { advanceId },
      create: {
        advanceId,
        reviewerId: body.reviewerId,
        finalGrade: body.finalGrade,
        humanComment: body.humanComment,
        findingDecisions: body.findingDecisions as Prisma.InputJsonValue,
        checklist: body.checklist as Prisma.InputJsonValue,
        status: body.status ?? ReviewStatus.DRAFT,
      },
      update: {
        finalGrade: body.finalGrade,
        humanComment: body.humanComment,
        findingDecisions: body.findingDecisions as Prisma.InputJsonValue,
        checklist: body.checklist as Prisma.InputJsonValue,
        status: body.status,
      },
    });

    if (body.advanceStatus) {
      await this.prisma.advance.update({
        where: { id: advanceId },
        data: { status: body.advanceStatus },
      });
    }

    await this.activity.log('REVIEW_UPDATED', `Revisión humana actualizada para avance ${advance.title}`, {
      advanceId,
      userId: body.reviewerId,
    });

    return review;
  }

  async addAnnotation(advanceId: string, authorId: string, data: { content: string; page?: number; paragraph?: string }) {
    return this.prisma.annotation.create({
      data: { advanceId, authorId, ...data },
    });
  }

  getVersions(advanceGroupId: string) {
    return this.prisma.advance.findMany({
      where: { advanceGroupId },
      include: { aiAnalysis: true, review: true },
      orderBy: { version: 'asc' },
    });
  }
}
