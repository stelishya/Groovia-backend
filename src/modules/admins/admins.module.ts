import { Module } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { IAdminServiceToken } from './interfaces/admins.service.interface';
import { IAdminRepoToken } from './interfaces/admins.repo.interface';
import { AdminRepository } from './repositories/admin.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, adminSchema } from './models/admins.schema';
import { UsersModule } from '../users/users.module';
import { User, userSchema } from '../users/models/user.schema';
import { UpgradeRequest, upgradeRequestSchema } from '../users/models/upgrade-request.schema';
import { Workshop, WorkshopSchema } from '../workshops/models/workshop.schema';
import { Competition, CompetitionSchema } from '../competitions/models/competition.schema';
import { Payment, PaymentSchema } from '../payments/models/payment.schema';

@Module({
  providers: [
    {
      provide: IAdminServiceToken,
      useClass: AdminsService
    },
    {
      provide: IAdminRepoToken,
      useClass : AdminRepository
    }
  ],
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: adminSchema },
      { name: User.name, schema: userSchema },
      { name: Workshop.name, schema: WorkshopSchema },
      { name: Competition.name, schema: CompetitionSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: UpgradeRequest.name, schema: upgradeRequestSchema },
    ]),
    UsersModule
  ],
  controllers: [AdminsController],
  exports: [IAdminServiceToken]
})
export class AdminsModule {}
