import { RedisClientType } from 'redis';

export const IRedisServiceToken = Symbol('IRedisService');

export interface IRedisService {
    readonly client: RedisClientType;
}
