import { Module } from '@nestjs/common';
import { DancerController } from './dancer.controller';
import { DancerService } from './dancer.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Events, EventSchema } from '../client/models/events.schema';

@Module({
  imports:[
    UsersModule,
    AuthModule,
    MongooseModule.forFeature([{ name: Events.name, schema: EventSchema }])
  ],
  controllers: [DancerController],
  providers: [DancerService]
})
export class DancerModule {}
