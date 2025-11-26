import { BadRequestException, Controller, Get, Param, Patch, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { MESSAGES } from 'src/common/constants/constants';
import { ApiResponse } from 'src/common/models/common-response.model';
import { NotificationService } from '../services/notification.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwtAuth.guard';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get('user/:userId')
    async getMyNotifications(
        @Param('userId') userId: string,
        @ActiveUser('userId') activeUserId: string,
        @Query('limit') limit: number = 20,
        @Query('page') page: number = 1
    ) {
        if (userId !== activeUserId) {
            throw new ForbiddenException('You can only access your own notifications');
        }

        const notifications = await this.notificationService.getUserNotifications(userId);
        return ApiResponse.success({
            notifications,
            pagination: {
                total: notifications.length,
                page,
                limit,
                totalPages: Math.ceil(notifications.length / limit)
            }
        });
    }

    @Get('unread-count')
    async getUnreadCount(@ActiveUser('userId') userId: string) {
        const count = await this.notificationService.getUnreadCount(userId);
        return ApiResponse.success({ count });
    }

    @Patch(':id/read')
    async markAsRead(
        @Param('id') id: string,
        @ActiveUser('userId') userId: string
    ) {
        const notification = await this.notificationService.markAsRead(id);
        // Verify the notification belongs to the user
        if (notification && notification.userId.toString() !== userId) {
            throw new BadRequestException('Not authorized to access this notification');
        }
        return ApiResponse.success(notification);
    }

    @Patch('user/:userId/read-all')
    async markAllAsRead(
        @Param('userId') userId: string,
        @ActiveUser('userId') activeUserId: string
    ) {
        if (userId !== activeUserId) {
            throw new ForbiddenException('You can only perform this action for your own account');
        }

        await this.notificationService.markAllAsRead(userId);
        return ApiResponse.success({
            message: MESSAGES.ALL_NOTIFICATIONS_MARKED_AS_READ,
            success: true
        });
    }
}
