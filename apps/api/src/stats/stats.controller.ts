import { Controller, Get, Header, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('analytics')
  analytics(@Query('programId') programId?: string) {
    return this.stats.getAnalytics(programId);
  }

  @Get('export/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="avances.csv"')
  exportCsv(@Query('programId') programId?: string) {
    return this.stats.exportCsv(programId);
  }
}
