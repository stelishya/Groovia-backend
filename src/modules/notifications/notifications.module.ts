import { Module } from '@nestjs/common';
import { NotificationsController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './models/notification.schema';
import { INotificationServiceToken } from './interfaces/notifications.service.interface';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema }
    ])
  ],
  providers: [{
    provide: INotificationServiceToken,
    useClass: NotificationService
  }],
  controllers: [NotificationsController],
  exports: [INotificationServiceToken],
})
export class NotificationsModule { }
