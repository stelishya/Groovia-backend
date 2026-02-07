import { Module } from '@nestjs/common';
import { DancerController } from './dancer.controller';
import { DancerService } from './dancer.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ClientModule } from '../client/client.module';
import { IDancerServiceToken } from './interfaces/dancer.interface';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ClientModule,
  ],
  controllers: [DancerController],
  providers: [
    {
      provide: IDancerServiceToken,
      useClass: DancerService,
    },
  ],
  exports: [IDancerServiceToken],
})
export class DancerModule { }
