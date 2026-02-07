import { Inject, Injectable } from '@nestjs/common';
import { type RedisClientType } from 'redis';
import { REDIS_CLIENT_TOKEN } from './redis.provider';
import { IRedisService } from './interfaces/redis.service.interface';

@Injectable()
export class RedisService implements IRedisService {
  constructor(
    @Inject(REDIS_CLIENT_TOKEN)
    private readonly _redisClient: RedisClientType,
  ) { }

  get client(): RedisClientType {
    return this._redisClient;
  }
}
