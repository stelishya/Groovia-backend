import { SortOrder } from 'mongoose';
import { Notification } from '../models/notification.schema';
import { NotificationType } from 'src/common/enums/notification-type.enum';
import { FilterQuery, Types, UpdateQuery } from 'mongoose';

export const INotificationRepoToken = Symbol('INotificationRepo');

export type NotificationMetadata = {
  eventId?: string;
  clientId?: string;
  clientName?: string;
  eventType?: string;
  eventDate?: Date;
  venue?: string;
  status?: string;
};

export interface INotificationRepo {
  create(
    userId: Types.ObjectId,
    type: NotificationType,
    title: string,
    message: string,
    adminNote?: string,
    metadata?: NotificationMetadata,
  ): Promise<Notification>;

  find(
    filter: FilterQuery<Notification>,
    sort?: string | Record<string, SortOrder> | SortOrder,
    limit?: number,
  ): Promise<Notification[]>;

  count(filter: FilterQuery<Notification>): Promise<number>;

  update(
    filter: FilterQuery<Notification> | string,
    update: UpdateQuery<Notification>,
  ): Promise<Notification | null>;

  updateMany(
    filter: FilterQuery<Notification>,
    update: UpdateQuery<Notification>,
  ): Promise<void>;
}
