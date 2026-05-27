import { Controller, Get, Header, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('acta/:advanceId')
  @Header('Content-Type', 'text/html; charset=utf-8')
  acta(@Param('advanceId') advanceId: string) {
    return this.reports.buildActaHtml(advanceId);
  }

  @Get('acta/:advanceId/pdf')
  async actaPdf(@Param('advanceId') advanceId: string, @Res() res: Response) {
    const buffer = await this.reports.buildActaPdf(advanceId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="acta-${advanceId}.pdf"`);
    res.send(buffer);
  }

  @Get('versions/:groupId')
  versions(@Param('groupId') groupId: string) {
    return this.reports.versionComparison(groupId);
  }
}
