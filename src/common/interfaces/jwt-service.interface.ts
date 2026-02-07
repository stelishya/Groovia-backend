import { JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';

export const IJwtServiceToken = Symbol('IJwtService');

export interface IJwtService {
    signAsync(payload: string | Buffer | object, options?: JwtSignOptions): Promise<string>;
    verifyAsync<T extends object = any>(token: string, options?: JwtVerifyOptions): Promise<T>;
    decode<T = any>(token: string): T;
}
