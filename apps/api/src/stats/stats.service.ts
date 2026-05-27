import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getAnalytics(programId?: string) {
    const where = programId ? { programId } : {};
    const advances = await this.prisma.advance.findMany({
      where,
      include: { aiAnalysis: true, review: true, program: true },
    });

    const byStatus: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    const scores: number[] = [];
    const radar = { structure: 0, content: 0, form: 0, originality: 0, n: 0 };
    const concordancePairs: Array<{ ia: number; human: number }> = [];

    for (const a of advances) {
      byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
      const month = a.createdAt.toISOString().slice(0, 7);
      byMonth[month] = (byMonth[month] ?? 0) + 1;
      if (a.aiAnalysis) {
        scores.push(a.aiAnalysis.overallScore);
        radar.structure += a.aiAnalysis.structureScore;
        radar.content += a.aiAnalysis.contentScore;
        radar.form += a.aiAnalysis.formScore;
        radar.originality += a.aiAnalysis.originalityScore;
        radar.n += 1;
        if (a.review?.finalGrade != null) {
          concordancePairs.push({ ia: a.aiAnalysis.gradeConverted, human: a.review.finalGrade });
        }
      }
    }

    const advisorGroups = await this.prisma.review.groupBy({
      by: ['reviewerId'],
      _count: { id: true },
    });
    const reviewerIds = advisorGroups.map((g) => g.reviewerId);
    const reviewers = await this.prisma.user.findMany({
      where: { id: { in: reviewerIds } },
      select: { id: true, name: true },
    });
    const nameById = Object.fromEntries(reviewers.map((r) => [r.id, r.name]));
    const advisorLoad = advisorGroups.map((g) => ({
      reviewerId: g.reviewerId,
      name: nameById[g.reviewerId] ?? g.reviewerId,
      _count: g._count,
    }));

    return {
      byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
      byMonth: Object.entries(byMonth).map(([month, count]) => ({ month, count })),
      scoreDistribution: this.histogram(scores),
      radar: radar.n
        ? {
            structure: Math.round(radar.structure / radar.n),
            content: Math.round(radar.content / radar.n),
            form: Math.round(radar.form / radar.n),
            originality: Math.round(radar.originality / radar.n),
          }
        : null,
      iaHumanConcordance: concordancePairs,
      advisorLoad,
      totals: { advances: advances.length, withAi: scores.length },
    };
  }

  private histogram(scores: number[]) {
    const buckets = [0, 0, 0, 0, 0];
    for (const s of scores) {
      const i = Math.min(4, Math.floor(s / 20));
      buckets[i] += 1;
    }
    return ['0-20', '21-40', '41-60', '61-80', '81-100'].map((range, i) => ({ range, count: buckets[i] }));
  }

  async exportCsv(programId?: string) {
    const rows = await this.prisma.advance.findMany({
      where: programId ? { programId } : {},
      include: { aiAnalysis: true, review: true, student: true, program: true },
    });
    const header = 'id,title,student,program,status,iaScore,iaGrade,humanGrade,createdAt\n';
    const body = rows
      .map(
        (r) =>
          `${r.id},"${r.title}","${r.student.name}","${r.program.name}",${r.status},${r.aiAnalysis?.overallScore ?? ''},${r.aiAnalysis?.gradeConverted ?? ''},${r.review?.finalGrade ?? ''},${r.createdAt.toISOString()}`,
      )
      .join('\n');
    return header + body;
  }
}
