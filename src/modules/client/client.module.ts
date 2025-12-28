import { Module } from '@nestjs/common';
import { ClientController } from './controller/client.controller';
import { ClientService } from './services/client.service';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Events, EventSchema } from './models/events.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { RazorpayModule } from 'src/common/payments/razorpay/razorpay.module';
import { PaymentsModule } from '../payments/payments.module';

import { IClientInterfaceToken } from './interfaces/client.interface';

@Module({
  imports: [
    UsersModule,
    NotificationsModule,
    MongooseModule.forFeature([{ name: Events.name, schema: EventSchema }]),
    RazorpayModule,
    PaymentsModule
  ],
  controllers: [ClientController],
  providers: [{
    provide: IClientInterfaceToken,
    useClass: ClientService
  }],
  exports: [IClientInterfaceToken]
})
export class ClientModule { }
