import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { IUserServiceToken } from './interfaces/services/user.service.interface';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from './models/user.schema';
import { UserRepository } from './repositories/user.repo';
import { IUserRepositoryToken } from './interfaces/user.repo.interface';

@Module({
  imports:[MongooseModule.forFeature([
    {name:User.name,schema:userSchema}
  ])],
  providers: [
    { provide:IUserServiceToken, useClass:UsersService},
    { provide:IUserRepositoryToken, useClass:UserRepository},
  ],
  exports:[IUserServiceToken,IUserRepositoryToken]
})
export class UsersModule {}
