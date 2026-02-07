export const INotificationServiceToken = 'INotificationService';

import { Types } from 'mongoose';
import { Notification } from '../models/notification.schema';
import { NotificationMetadata } from '../interfaces/notifications.repo.interface';
import { NotificationType } from 'src/common/enums/notification-type.enum';

export interface INotificationService {
  createNotification(
    userId: Types.ObjectId,
    type: NotificationType,
    title: string,
    message: string,
    adminNote?: string,
    metadata?: NotificationMetadata,
  ): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(notificationId: string): Promise<Notification | null>;
  markAllAsRead(userId: string): Promise<void>;
}
