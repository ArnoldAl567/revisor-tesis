import { Module } from '@nestjs/common';
import { DocumentPreviewService } from './document-preview.service';

@Module({
  providers: [DocumentPreviewService],
  exports: [DocumentPreviewService],
})
export class DocumentsModule {}
