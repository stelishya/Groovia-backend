import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, SortOrder, Types, UpdateQuery } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from '../models/notification.schema';
import {
  INotificationRepo,
  NotificationMetadata,
} from '../interfaces/notifications.repo.interface';

@Injectable()
export class NotificationRepository implements INotificationRepo {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(
    userId: Types.ObjectId,
    type: NotificationType,
    title: string,
    message: string,
    adminNote?: string,
    metadata?: NotificationMetadata,
  ): Promise<Notification> {
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

  async find(
    filter: FilterQuery<Notification>,
    sort: Record<string, SortOrder> = { createdAt: -1 },
    limit: number = 50,
  ): Promise<Notification[]> {
    return await this.notificationModel
      .find(filter)
      .sort(sort)
      .limit(limit)
      .exec();
  }

  async count(filter: FilterQuery<Notification>): Promise<number> {
    return this.notificationModel.countDocuments(filter).exec();
  }

  async update(
    idOrFilter: string | FilterQuery<Notification>,
    update: UpdateQuery<Notification>,
  ): Promise<Notification | null> {
    const filter =
      typeof idOrFilter === 'string' ? { _id: idOrFilter } : idOrFilter;
    return await this.notificationModel
      .findOneAndUpdate(filter, update, { new: true })
      .exec();
  }

  async updateMany(
    filter: FilterQuery<Notification>,
    update: UpdateQuery<Notification>,
  ): Promise<void> {
    await this.notificationModel.updateMany(filter, update).exec();
  }
}
