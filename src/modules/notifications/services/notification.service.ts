import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationType } from '../models/notification.schema';

type NotificationMetadata = {
    eventId?: string;
    clientId?: string;
    clientName?: string;
    eventType?: string;
    eventDate?: Date;
    venue?: string;
    status?: string;
};


@Injectable()
export class NotificationService {
    constructor(
        @InjectModel(Notification.name)
        private notificationModel: Model<Notification>,
    ) { }

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

        const notification = new this.notificationModel({
            userId,
            type,
            title,
            message,
            adminNote,
            isRead: false,
            metadata: metadata || {},
        });

        return await notification.save();
    }
    async getUserNotifications(userId: string): Promise<Notification[]> {
        if (!userId || !Types.ObjectId.isValid(userId)) {
            throw new BadRequestException('Invalid user ID');
        }

        return await this.notificationModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .limit(50) // Limit to most recent 50 notifications
            .exec();
    }

    async getUnreadCount(userId: string): Promise<number> {
        if (!userId || !Types.ObjectId.isValid(userId)) {
            throw new BadRequestException('Invalid user ID');
        }

        return this.notificationModel.countDocuments({
            userId: new Types.ObjectId(userId),
            isRead: false
        }).exec();
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
