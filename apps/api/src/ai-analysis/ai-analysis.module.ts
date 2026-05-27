import { Module } from '@nestjs/common';
import { AiAnalysisService } from './ai-analysis.service';

@Module({
  providers: [AiAnalysisService],
  exports: [AiAnalysisService], // <--- ESTA LÍNEA ES LA CLAVE
})
export class AiAnalysisModule {}