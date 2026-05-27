import { Controller, Get, Param, Patch, Query, Sse } from '@nestjs/common';
import { Observable, interval, map, mergeMap, from } from 'rxjs';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Query('userId') userId?: string, @Query('unread') unread?: string) {
    return this.notifications.list(userId, unread === 'true');
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.notifications.markRead(id);
  }

  @Sse('stream')
  stream(@Query('userId') userId?: string): Observable<MessageEvent> {
    return interval(5000).pipe(
      mergeMap(() => from(this.notifications.list(userId, true))),
      map((items) => ({ data: { notifications: items, at: new Date().toISOString() } }) as MessageEvent),
    );
  }
}
