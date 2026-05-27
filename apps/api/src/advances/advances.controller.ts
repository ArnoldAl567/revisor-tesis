import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdvanceStatus } from '@prisma/client';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { AdvancesService } from './advances.service';
import { StorageService } from '../storage/storage.service';
import { DocumentPreviewService } from '../documents/document-preview.service';

@Controller('advances')
export class AdvancesController {
  constructor(
    private readonly advancesService: AdvancesService,
    private readonly storage: StorageService,
    private readonly documentPreview: DocumentPreviewService,
  ) {}

  @Get('ai-providers')
  getAiProviders() {
    return this.advancesService.getAiProviders();
  }

  @Get('institution-config')
  institutionConfig() {
    return this.advancesService.getInstitutionConfig();
  }

  @Patch('institution-config')
  updateInstitutionConfig(@Body() body: { maxGrade?: number; gradeScale?: string; weights?: unknown }) {
    return this.advancesService.updateInstitutionConfig(body);
  }

  @Get()
  list(
    @Query('programId') programId?: string,
    @Query('status') status?: AdvanceStatus,
    @Query('studentId') studentId?: string,
  ) {
    return this.advancesService.list({ programId, status, studentId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.advancesService.findOne(id);
  }

  @Get(':id/preview')
  preview(@Param('id') id: string) {
    return this.advancesService.getPreviewUrl(id);
  }

  @Get(':id/file')
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const advance = await this.advancesService.findOne(id);
    if (!advance) throw new BadRequestException('Avance no encontrado');
    const path = this.storage.getFilePath(advance.fileKey);
    const contentType = advance.fileType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    res.setHeader('Content-Type', contentType);
    createReadStream(path).pipe(res);
  }

  @Get(':id/pdf')
  async downloadPdf(
    @Param('id') id: string,
    @Query('download') download: string | undefined,
    @Res() res: Response,
  ) {
    const advance = await this.advancesService.findOne(id);
    if (!advance) throw new BadRequestException('Avance no encontrado');
    const pdfPath = await this.documentPreview.ensurePreviewPdf(advance.fileKey, advance.fileType);
    const filename = `${advance.title.replace(/[^\w.-]+/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      download === '1' ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`,
    );
    createReadStream(pdfPath).pipe(res);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAdvance(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      studentId?: string;
      templateId?: string;
      advanceType?: string;
      title?: string;
      provider?: string;
      advanceGroupId?: string;
      sync?: string;
    },
  ) {
    if (!file) throw new BadRequestException('Archivo no encontrado');

    if (body.sync === 'true') {
      const result = await this.advancesService.processFullPipeline(file, body);
      return { message: 'Análisis completado', ...result, result: result.advance };
    }

    const queued = await this.advancesService.uploadAndEnqueue(file, body);
    return { message: 'Avance encolado para análisis IA', ...queued };
  }
}
