import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { UsersModule } from '../users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Events, EventSchema } from './models/events.schema';

@Module({
  imports:[
    UsersModule,
    MongooseModule.forFeature([{ name: Events.name, schema: EventSchema }])
  ],
  controllers: [ClientController],
  providers: [ClientService]
})
export class ClientModule {}
