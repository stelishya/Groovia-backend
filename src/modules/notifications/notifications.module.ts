import { Module } from '@nestjs/common';
import { NotificationsController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './models/notification.schema';
import { INotificationServiceToken } from './interfaces/notifications.service.interface';
import { INotificationRepoToken } from './interfaces/notifications.repo.interface';
import { NotificationRepository } from './repositories/notification.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  providers: [
    {
      provide: INotificationServiceToken,
      useClass: NotificationService,
    },
    {
      provide: INotificationRepoToken,
      useClass: NotificationRepository,
    },
  ],
  controllers: [NotificationsController],
  exports: [INotificationServiceToken],
})
export class NotificationsModule {}
