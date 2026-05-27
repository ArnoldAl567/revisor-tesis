import { Module } from '@nestjs/common';
import { AdvancesService } from './advances.service';
import { AdvancesController } from './advances.controller';
import { AdvanceAnalysisProcessor } from './advance-analysis.processor';
import { AiAnalysisModule } from '../ai-analysis/ai-analysis.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { QueueModule } from '../queue/queue.module';
import { BulkModule } from '../bulk/bulk.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [QueueModule, AiAnalysisModule, NotificationsModule, BulkModule, DocumentsModule],
  providers: [AdvancesService, AdvanceAnalysisProcessor],
  controllers: [AdvancesController],
  exports: [AdvancesService],
})
export class AdvancesModule {}
