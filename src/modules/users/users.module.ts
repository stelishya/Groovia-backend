import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { IUserServiceToken } from './interfaces/services/user.service.interface';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from './models/user.schema';
import { UserRepository } from './repositories/user.repo';
import { IUserRepositoryToken } from './interfaces/user.repo.interface';
import { IBaseRepository, IBaseRepositoryToken } from 'src/common/interfaces/base-repository.interface';
import { UpgradeRequest, upgradeRequestSchema } from './models/upgrade-request.schema';
import { UpgradeRequestController } from './controllers/upgrade-request.controller';
import { UpgradeRequestService } from './services/upgrade-request.service';
import { IUpgradeRequestServiceToken } from './interfaces/upgrade-request.service.interface';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MongooseModule.forFeature([
    { name: User.name, schema: userSchema },
    { name: UpgradeRequest.name, schema: upgradeRequestSchema }
  ]),
    NotificationsModule,
  ],
  controllers: [UpgradeRequestController],
  providers: [
    UsersService,
    { provide: IUserServiceToken, useClass: UsersService },
    { provide: IUserRepositoryToken, useClass: UserRepository },
    { provide: IBaseRepositoryToken, useClass: UserRepository },
    { provide: IUpgradeRequestServiceToken, useClass: UpgradeRequestService }
  ],
  exports: [IUserServiceToken, IUserRepositoryToken, IBaseRepositoryToken, IUpgradeRequestServiceToken, UsersService]
})
export class UsersModule { }
