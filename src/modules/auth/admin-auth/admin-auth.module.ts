import { Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { IAdminAuthServiceToken } from './interfaces/admin-auth.service.interface';
import { JwtService } from '@nestjs/jwt';
import { AdminsModule } from 'src/modules/admins/admins.module';
import { HashingModule } from 'src/common/hashing/hashing.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [AdminsModule, HashingModule, CommonModule],
  providers: [
    {
      provide: IAdminAuthServiceToken,
      useClass: AdminAuthService,
    },
    JwtService,
  ],
  controllers: [AdminAuthController],
})
export class AdminAuthModule {}
