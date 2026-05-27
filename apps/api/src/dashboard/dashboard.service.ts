import { Injectable } from '@nestjs/common';
import { AdvanceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview(filters?: {
    programId?: string;
    status?: AdvanceStatus;
    advisorId?: string;
    minScore?: number;
    maxScore?: number;
  }) {
    const where: Record<string, unknown> = {};
    if (filters?.programId) where.programId = filters.programId;
    if (filters?.status) where.status = filters.status;

    const advances = await this.prisma.advance.findMany({
      where,
      include: {
        aiAnalysis: true,
        review: true,
        student: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    let filtered = advances;
    if (filters?.minScore != null) {
      filtered = filtered.filter((a) => (a.aiAnalysis?.overallScore ?? 0) >= filters.minScore!);
    }
    if (filters?.maxScore != null) {
      filtered = filtered.filter((a) => (a.aiAnalysis?.overallScore ?? 100) <= filters.maxScore!);
    }

    const pending = filtered.filter((a) =>
      ['PENDING', 'AI_ANALYZING', 'AI_COMPLETE', 'IN_HUMAN_REVIEW'].includes(a.status),
    ).length;
    const reviewed = filtered.filter((a) =>
      ['OBSERVED', 'APPROVED', 'REJECTED'].includes(a.status),
    ).length;
    const rejected = filtered.filter((a) => a.status === 'REJECTED').length;

    const withAi = filtered.filter((a) => a.aiAnalysis);
    const avgAi =
      withAi.length > 0
        ? withAi.reduce((s, a) => s + (a.aiAnalysis?.gradeConverted ?? 0), 0) / withAi.length
        : 0;
    const withHuman = filtered.filter((a) => a.review?.finalGrade != null);
    const avgHuman =
      withHuman.length > 0
        ? withHuman.reduce((s, a) => s + (a.review!.finalGrade ?? 0), 0) / withHuman.length
        : 0;

    const concordance =
      withAi.length && withHuman.length
        ? Math.round(
            (filtered.filter(
              (a) =>
                a.aiAnalysis &&
                a.review?.finalGrade != null &&
                Math.abs(a.aiAnalysis.gradeConverted - a.review.finalGrade) <= 2,
            ).length /
              withHuman.length) *
              100,
          )
        : 0;

    const lowCompliance = filtered.filter((a) => (a.aiAnalysis?.overallScore ?? 100) < 60);

    const activities = await this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    return {
      kpis: {
        pending,
        reviewed,
        rejected,
        avgAiGrade: Math.round(avgAi * 10) / 10,
        avgHumanGrade: Math.round(avgHuman * 10) / 10,
        iaHumanConcordance: concordance,
        lowComplianceCount: lowCompliance.length,
      },
      recentAdvances: filtered.slice(0, 10).map((a) => ({
        id: a.id,
        title: a.title,
        student: a.student.name,
        program: a.program.name,
        status: a.status,
        overallScore: a.aiAnalysis?.overallScore ?? null,
        gradeConverted: a.aiAnalysis?.gradeConverted ?? null,
        createdAt: a.createdAt,
      })),
      alerts: lowCompliance.slice(0, 8).map((a) => ({
        id: a.id,
        title: a.title,
        score: a.aiAnalysis?.overallScore,
        student: a.student.name,
      })),
      timeline: activities,
    };
  }
}
