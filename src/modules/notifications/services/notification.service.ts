import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Notification } from '../models/notification.schema';
import {
  type INotificationRepo,
  INotificationRepoToken,
  NotificationMetadata,
} from '../interfaces/notifications.repo.interface';
import { Types } from 'mongoose';
import { NotificationType } from 'src/common/enums/notification-type.enum';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(INotificationRepoToken)
    private notificationRepo: INotificationRepo,
  ) {}

  async createNotification(
    userId: Types.ObjectId,
    type: NotificationType,
    title: string,
    message: string,
    adminNote?: string,
    metadata?: NotificationMetadata,
  ): Promise<Notification> {
    if (!userId || !Types.ObjectId.isValid(userId.toString())) {
      throw new BadRequestException('Invalid user ID');
    }

    return await this.notificationRepo.create(
      userId,
      type,
      title,
      message,
      adminNote,
      metadata,
    );
  }
  async getUserNotifications(userId: string): Promise<Notification[]> {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return await this.notificationRepo.find(
      { userId: new Types.ObjectId(userId) },
      { createdAt: -1 },
      50,
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.notificationRepo.count({
      userId: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  async markAsRead(notificationId: string): Promise<Notification | null> {
    return await this.notificationRepo.update(notificationId, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { isRead: true },
    );
  }
}
