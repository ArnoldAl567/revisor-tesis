import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AdvanceStatus } from '@prisma/client';
import { BulkService } from './bulk.service';

@Controller('bulk')
export class BulkController {
  constructor(private readonly bulk: BulkService) {}

  @Get('eligible')
  eligible(@Query('programId') programId?: string, @Query('status') status?: AdvanceStatus) {
    return this.bulk.getEligibleAdvances({ programId, status });
  }

  @Get('jobs')
  list() {
    return this.bulk.listJobs();
  }

  @Get('jobs/:id')
  get(@Param('id') id: string) {
    return this.bulk.getJob(id);
  }

  @Post('jobs')
  create(
    @Body()
    body: {
      advanceIds?: string[];
      programId?: string;
      status?: string;
      createdById?: string;
    },
  ) {
    if (body.advanceIds?.length) {
      return this.bulk.createJob(body.advanceIds, body.createdById, body.programId);
    }
    return this.bulk.createFromFilters(
      { programId: body.programId, status: body.status },
      body.createdById,
    );
  }
}
