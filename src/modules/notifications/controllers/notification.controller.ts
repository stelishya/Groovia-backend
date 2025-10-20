import { Controller, Get, Param, Patch  } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';

@Controller('notifications')
export class NotificationsController {
     constructor(private readonly notificationService: NotificationService) {}

    @Get('user/:userId')
    async getUserNotifications(@Param('userId') userId: string) {
        return await this.notificationService.getUserNotifications(userId);
    }

    @Patch(':id/read')
    async markAsRead(@Param('id') id: string) {
        return await this.notificationService.markAsRead(id);
    }

    @Patch('user/:userId/read-all')
    async markAllAsRead(@Param('userId') userId: string) {
        await this.notificationService.markAllAsRead(userId);
        return { message: 'All notifications marked as read' };
    }
}
