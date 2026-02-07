import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { REDIS_CLIENT_TOKEN, redisProvider } from './redis.provider';
import { RedisService } from './redis.service';
import { IRedisServiceToken } from './interfaces/redis.service.interface';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Module({
  imports: [ConfigModule],
  providers: [
    redisProvider,
    {
      provide: IRedisServiceToken,
      useClass: RedisService,
    },
    {
      provide: REDIS_CLIENT_TOKEN,
      useValue: redisProvider,// redis cloud instance
    },
  ],
  exports: [IRedisServiceToken, REDIS_CLIENT_TOKEN],
})
export class RedisModule { }
