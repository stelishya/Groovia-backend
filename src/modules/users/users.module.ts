import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { IUserServiceToken } from './interfaces/user.service.interface';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from './models/user.schema';
import { UserRepository } from './repositories/user.repo';
import { IUserRepositoryToken } from './interfaces/user.repo.interface';
import {
  IBaseRepository,
  IBaseRepositoryToken,
} from 'src/common/interfaces/base-repository.interface';
import {
  UpgradeRequest,
  upgradeRequestSchema,
} from './upgrade-role/models/upgrade-request.schema';
import { UpgradeRequestController } from './upgrade-role/controllers/upgrade-request.controller';
import { UpgradeRequestService } from './upgrade-role/services/upgrade-request.service';
import { IUpgradeRequestServiceToken } from './upgrade-role/interface/upgrade-request.service.interface';
import { IUpgradeRequestRepoToken } from './upgrade-role/interface/upgrade-request.repo.interface';
import { UpgradeRequestRepository } from './upgrade-role/repositories/upgrade-req.repo';
import { NotificationsModule } from '../notifications/notifications.module';
import { RazorpayModule } from 'src/common/payments/razorpay/razorpay.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
      { name: UpgradeRequest.name, schema: upgradeRequestSchema },
    ]),
    NotificationsModule,
    RazorpayModule,
    PaymentsModule,
  ],
  controllers: [UpgradeRequestController],
  providers: [
    { provide: IUserServiceToken, useClass: UsersService },
    { provide: IUserRepositoryToken, useClass: UserRepository },
    { provide: IBaseRepositoryToken, useClass: UserRepository },
    { provide: IUpgradeRequestServiceToken, useClass: UpgradeRequestService },
    { provide: IUpgradeRequestRepoToken, useClass: UpgradeRequestRepository },
  ],
  exports: [
    IUserServiceToken,
    IUserRepositoryToken,
    IBaseRepositoryToken,
    IUpgradeRequestServiceToken,
    IUpgradeRequestRepoToken,
  ],
})
export class UsersModule {}
