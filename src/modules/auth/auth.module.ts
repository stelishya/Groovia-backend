import { Module } from '@nestjs/common';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { UserAuthModule } from './user-auth/user-auth.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [AdminAuthModule, UserAuthModule, CommonModule],
})
export class AuthModule { }
