import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationType } from '../models/notification.schema';


@Injectable()
export class NotificationService {
     constructor(
        @InjectModel(Notification.name)
        private notificationModel: Model<Notification>,
    ) {}

    async createNotification(
        userId: Types.ObjectId,
        type: NotificationType,
        title: string,
        message: string,
        adminNote?: string,
    ): Promise<Notification> {
        const notification = new this.notificationModel({
            userId,
            type,
            title,
            message,
            adminNote,
            isRead: false,
        });
        return await notification.save();
    }
    async getUserNotifications(userId: string): Promise<Notification[]> {
        return await this.notificationModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .exec();
    }

    async markAsRead(notificationId: string): Promise<Notification | null> {
        return await this.notificationModel
            .findByIdAndUpdate(notificationId, { isRead: true }, { new: true })
            .exec();
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationModel
            .updateMany(
                { userId: new Types.ObjectId(userId), isRead: false },
                { isRead: true },
            )
            .exec();
    }
}
