import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notifications for current user' })
  getUnread(@CurrentUser() user: any) {
    if (user.type === 'customer') {
      return this.notificationsService.getUnread(undefined, user.id);
    }
    return this.notificationsService.getUnread(user.id);
  }

  @Post('mark-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markRead(@CurrentUser() user: any) {
    if (user.type === 'customer') {
      return this.notificationsService.markAllRead(undefined, user.id);
    }
    return this.notificationsService.markAllRead(user.id);
  }
}
