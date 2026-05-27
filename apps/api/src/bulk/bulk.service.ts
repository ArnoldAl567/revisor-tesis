import { BadRequestException, Injectable } from '@nestjs/common';
import { AdvanceStatus, BulkJobStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ActivityService } from '../activity/activity.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class BulkService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('advance-analysis') private analysisQueue: Queue,
    private activity: ActivityService,
    private storage: StorageService,
  ) {}

  async getEligibleAdvances(filters?: { programId?: string; status?: AdvanceStatus }) {
    const statusFilter = filters?.status
      ? { status: filters.status }
      : { status: { in: [AdvanceStatus.PENDING, AdvanceStatus.AI_ANALYZING] as AdvanceStatus[] } };

    const advances = await this.prisma.advance.findMany({
      where: {
        ...statusFilter,
        ...(filters?.programId ? { programId: filters.programId } : {}),
        aiAnalysis: null,
      },
      include: {
        student: { select: { id: true, name: true } },
        program: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return advances
      .filter((a) => this.storage.canAnalyze(a.fileKey))
      .map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        student: a.student,
        program: a.program,
        fileKey: a.fileKey,
        analyzable: true,
      }));
  }

  async createJob(advanceIds: string[], createdById?: string, programId?: string) {
    const uniqueIds = [...new Set(advanceIds)];
    const advances = await this.prisma.advance.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, fileKey: true, title: true },
    });

    const eligible = advances.filter((a) => this.storage.canAnalyze(a.fileKey));
    const skipped = uniqueIds.length - eligible.length;

    if (eligible.length === 0) {
      throw new BadRequestException(
        'Ningún avance seleccionado tiene documento disponible para análisis. Suba archivos reales desde Cargar avance.',
      );
    }

    const job = await this.prisma.bulkJob.create({
      data: {
        total: eligible.length,
        createdById,
        programId,
        status: BulkJobStatus.PENDING,
        items: {
          create: eligible.map((a) => ({ advanceId: a.id, status: 'PENDING' })),
        },
      },
      include: { items: true },
    });

    for (const item of job.items) {
      if (item.advanceId) {
        await this.analysisQueue.add(
          'analyze',
          { advanceId: item.advanceId, bulkJobId: job.id, bulkItemId: item.id },
          { removeOnComplete: 100, removeOnFail: 50 },
        );
      }
    }

    await this.prisma.bulkJob.update({
      where: { id: job.id },
      data: { status: BulkJobStatus.PROCESSING },
    });

    await this.activity.log('BULK_STARTED', `Lote ${job.id}: ${eligible.length} avance(s) en cola`, {
      userId: createdById,
      metadata: { bulkJobId: job.id, skipped },
    });

    return { ...job, skipped, message: `${eligible.length} avance(s) encolados` };
  }

  async createFromFilters(filters: { programId?: string; status?: string }, createdById?: string) {
    const eligible = await this.getEligibleAdvances({
      programId: filters.programId,
      status: filters.status as AdvanceStatus | undefined,
    });
    if (eligible.length === 0) {
      throw new BadRequestException('No hay avances pendientes analizables para este filtro.');
    }
    return this.createJob(
      eligible.map((a) => a.id),
      createdById,
      filters.programId,
    );
  }

  getJob(id: string) {
    return this.prisma.bulkJob.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            advance: {
              include: { aiAnalysis: true, student: { select: { name: true } } },
            },
          },
        },
      },
    });
  }

  listJobs() {
    return this.prisma.bulkJob.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
  }

  async updateProgress(bulkJobId: string, success: boolean) {
    const job = await this.prisma.bulkJob.findUnique({ where: { id: bulkJobId } });
    if (!job) return;
    const processed = job.processed + 1;
    const failed = success ? job.failed : job.failed + 1;
    const done = processed >= job.total;
    let status: BulkJobStatus = BulkJobStatus.PROCESSING;
    if (done) {
      status = failed >= job.total ? BulkJobStatus.FAILED : BulkJobStatus.COMPLETED;
    }
    await this.prisma.bulkJob.update({
      where: { id: bulkJobId },
      data: { processed, failed, status },
    });
  }
}
