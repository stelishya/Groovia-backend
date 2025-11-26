import { Module } from '@nestjs/common';
import { ClientController } from './controller/client.controller';
import { ClientService } from './services/client.service';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Events, EventSchema } from './models/events.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    UsersModule,
    NotificationsModule,
    MongooseModule.forFeature([{ name: Events.name, schema: EventSchema }])
  ],
  controllers: [ClientController],
  providers: [ClientService]
})
export class ClientModule { }
