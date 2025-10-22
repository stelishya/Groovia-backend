import { Module } from '@nestjs/common';
import { DancerController } from './dancer.controller';
import { DancerService } from './dancer.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:[UsersModule,AuthModule],
  controllers: [DancerController],
  providers: [DancerService]
})
export class DancerModule {}
