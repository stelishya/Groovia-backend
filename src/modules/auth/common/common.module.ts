import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { ICommonServiceToken } from './interfaces/common-service.interface';
import { OtpService } from '../../../common/otp/otp.service';
import { IOtpRepositoryToken } from 'src/common/otp/interfaces/otp.repo.interface';
import { OtpRepository } from '../../../common/otp/repositories/otp.repo';
import { MongooseModule } from '@nestjs/mongoose';
import { Otp, OtpSchema } from '../../../common/otp/models/otp.schema';
import { IOtpServiceToken } from '../../../common/otp/interfaces/otp.service.interface';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { RedisModule } from 'src/common/redis/redis.module';
import { IBaseRepositoryToken } from 'src/common/interfaces/base-repository.interface';
import { IUserServiceToken } from 'src/modules/users/interfaces/user.service.interface';
import { UsersService } from 'src/modules/users/services/users.service';
import { IUserRepositoryToken } from 'src/modules/users/interfaces/user.repo.interface';
import { UserRepository } from 'src/modules/users/repositories/user.repo';
import { BaseRepository } from 'src/common/repositories/base.repo';
import { User, userSchema } from 'src/modules/users/models/user.schema';
import { IJwtServiceToken } from 'src/common/interfaces/jwt-service.interface';
import { IConfigServiceToken } from 'src/common/interfaces/config-service.interface';
import { ConfigService } from '@nestjs/config';
import { IRedisServiceToken } from 'src/common/redis/interfaces/redis.service.interface';
import { RedisService } from 'src/common/redis/redis.service';

@Module({
  providers: [
    {
      provide: ICommonServiceToken,
      useClass: CommonService,
    },
    {
      provide: IOtpRepositoryToken,
      useClass: OtpRepository,
    },
    {
      provide: IOtpServiceToken,
      useClass: OtpService,
    },
    {
      provide: IUserServiceToken,
      useClass: UsersService,
    },
    {
      provide: IUserRepositoryToken,
      useClass: UserRepository,
    },
    {
      provide: IBaseRepositoryToken,
      useClass: BaseRepository,
    },
    {
      provide: IJwtServiceToken,
      useClass: JwtService,
    },
    {
      provide: IConfigServiceToken,
      useClass: ConfigService,
    },
    {
      provide: IRedisServiceToken,
      useClass: RedisService,
    }
  ],
  imports: [
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: User.name, schema: userSchema },
    ]),
    JwtModule.register({}),
    RedisModule,
  ],
  controllers: [CommonController],
  exports: [ICommonServiceToken, IOtpServiceToken, IOtpRepositoryToken, IJwtServiceToken, IConfigServiceToken, IRedisServiceToken],
})
export class CommonModule { }
