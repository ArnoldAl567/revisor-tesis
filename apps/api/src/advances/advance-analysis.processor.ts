import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AdvancesService } from './advances.service';
import { BulkService } from '../bulk/bulk.service';
import { PrismaService } from '../prisma/prisma.service';

@Processor('advance-analysis')
export class AdvanceAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(AdvanceAnalysisProcessor.name);

  constructor(
    private advances: AdvancesService,
    private bulk: BulkService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async process(
    job: Job<{ advanceId: string; provider?: string; bulkJobId?: string; bulkItemId?: string }>,
  ): Promise<void> {
    const { advanceId, provider, bulkJobId, bulkItemId } = job.data;
    const isBulk = Boolean(bulkJobId);

    try {
      await this.advances.runAnalysisForAdvance(advanceId, provider);
      if (bulkItemId) {
        await this.prisma.bulkJobItem.update({
          where: { id: bulkItemId },
          data: { status: 'COMPLETED', error: null },
        });
      }
      if (bulkJobId) await this.bulk.updateProgress(bulkJobId, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error analizando ${advanceId}: ${message}`);

      if (bulkItemId) {
        await this.prisma.bulkJobItem.update({
          where: { id: bulkItemId },
          data: { status: 'FAILED', error: message },
        });
      }
      if (bulkJobId) {
        await this.bulk.updateProgress(bulkJobId, false);
        return;
      }
      throw error;
    }
  }
}
