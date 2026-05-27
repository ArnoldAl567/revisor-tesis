import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AdvanceStatus } from '@prisma/client';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('advances')
  listAdvances(@Query('programId') programId?: string, @Query('status') status?: AdvanceStatus) {
    return this.reviews.list({ programId, status });
  }

  @Get('advances/:id')
  getAdvance(@Param('id') id: string) {
    return this.reviews.findOne(id);
  }

  @Get('groups/:groupId/versions')
  versions(@Param('groupId') groupId: string) {
    return this.reviews.getVersions(groupId);
  }

  @Patch('advances/:id')
  saveReview(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.reviews.upsertReview(id, body as Parameters<ReviewsService['upsertReview']>[1]);
  }

  @Post('advances/:id/annotations')
  annotate(@Param('id') id: string, @Body() body: { authorId: string; content: string; page?: number; paragraph?: string }) {
    return this.reviews.addAnnotation(id, body.authorId, body);
  }
}
