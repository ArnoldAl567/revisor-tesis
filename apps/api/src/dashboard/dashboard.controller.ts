import { Controller, Get, Query } from '@nestjs/common';
import { AdvanceStatus } from '@prisma/client';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('overview')
  overview(
    @Query('programId') programId?: string,
    @Query('status') status?: AdvanceStatus,
    @Query('minScore') minScore?: string,
    @Query('maxScore') maxScore?: string,
  ) {
    return this.dashboard.getOverview({
      programId,
      status,
      minScore: minScore ? Number(minScore) : undefined,
      maxScore: maxScore ? Number(maxScore) : undefined,
    });
  }
}
