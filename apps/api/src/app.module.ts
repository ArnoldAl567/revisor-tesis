import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './storage/storage.module';
import { ActivityModule } from './activity/activity.module';
import { AuthModule } from './auth/auth.module';
import { ProgramsModule } from './programs/programs.module';
import { AdvancesModule } from './advances/advances.module';
import { AiAnalysisModule } from './ai-analysis/ai-analysis.module';
import { TemplatesModule } from './templates/templates.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReviewsModule } from './reviews/reviews.module';
import { BulkModule } from './bulk/bulk.module';
import { ReportsModule } from './reports/reports.module';
import { StatsModule } from './stats/stats.module';
import { NotificationsModule } from './notifications/notifications.module';
import { QueueModule } from './queue/queue.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    ActivityModule,
    AiAnalysisModule,
    AuthModule,
    ProgramsModule,
    TemplatesModule,
    AdvancesModule,
    DashboardModule,
    ReviewsModule,
    BulkModule,
    ReportsModule,
    StatsModule,
    NotificationsModule,
    QueueModule,
    UsersModule,
  ],
})
export class AppModule {}
