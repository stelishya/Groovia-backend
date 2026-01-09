export const INotificationServiceToken = 'INotificationService';

import { Types } from "mongoose";
import { Notification, NotificationType } from "../models/notification.schema";

export interface INotificationService {
    createNotification(
        userId: Types.ObjectId,
        type: NotificationType,
        title: string,
        message: string,
        adminNote?: string,
        metadata?: any,
    ): Promise<Notification>;
    getUserNotifications(userId: string): Promise<Notification[]>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(notificationId: string): Promise<Notification | null>;
    markAllAsRead(userId: string): Promise<void>;
}
