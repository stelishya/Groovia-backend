import { Module } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { IAdminServiceToken } from './interfaces/admins.service.interface';
import { IAdminRepoToken } from './interfaces/admins.repo.interface';
import { AdminRepository } from './repositories/admin.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, adminSchema } from './models/admins.schema';

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
    ])
  ],
  controllers: [AdminsController],
  exports: [IAdminServiceToken]
})
export class AdminsModule {}
