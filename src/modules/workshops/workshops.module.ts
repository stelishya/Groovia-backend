import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageModule } from '../../common/storage/storage.module';
import { Workshop, WorkshopSchema } from './models/workshop.schema';
import { WorkshopsController } from './workshops.controller';
import { PaymentsModule } from '../payments/payments.module';
import { WorkshopsService } from './workshops.service';
import { WorkshopsRepository } from './repositories/workshops.repository';
import { RazorpayModule } from '../../common/payments/razorpay/razorpay.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { IWorkshopServiceToken } from './interfaces/workshop.service.interface';
import { IWorkshopRepoToken } from './interfaces/workshop.repo.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Workshop.name, schema: WorkshopSchema }]),
    StorageModule,
    RazorpayModule,
    PaymentsModule,
    NotificationsModule,
    UsersModule
  ],
  controllers: [WorkshopsController],
  providers: [
    {
      provide: IWorkshopServiceToken,
      useClass: WorkshopsService
    },
    {
      provide: IWorkshopRepoToken,
      useClass: WorkshopsRepository
    }
  ],
  exports: [IWorkshopServiceToken, IWorkshopRepoToken],
})
export class WorkshopsModule { }
