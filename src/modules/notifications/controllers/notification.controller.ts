import { Controller, Get, Param, Patch  } from '@nestjs/common';
import { MESSAGES } from 'src/common/constants/constants';
import { ApiResponse } from 'src/common/models/commonResponse.model';
import { NotificationService } from '../services/notification.service';

@Controller('notifications')
export class NotificationsController {
     constructor(private readonly notificationService: NotificationService) {}

    @Get('user/:userId')
    async getUserNotifications(@Param('userId') userId: string) {
        console.log("getUserNotifications in controller",userId)
        const notifications = await this.notificationService.getUserNotifications(userId);
        return ApiResponse.success(notifications);
    }

    @Patch(':id/read')
    async markAsRead(@Param('id') id: string) {
        const notification = await this.notificationService.markAsRead(id);
        return ApiResponse.success(notification);
    }

    @Patch('user/:userId/read-all')
    async markAllAsRead(@Param('userId') userId: string) {
        await this.notificationService.markAllAsRead(userId);
        return ApiResponse.success({ message: MESSAGES.ALL_NOTIFICATIONS_MARKED_AS_READ });
    }
}
