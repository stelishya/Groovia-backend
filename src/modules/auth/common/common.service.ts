import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { User } from 'src/modules/users/models/user.schema';

@Injectable()
export class CommonService {
    constructor(
        private readonly _jwtService:JwtService,
        private readonly _configService:ConfigService,
    ){}

    async generateToken(user:User):Promise<{accessToken:string,refreshToken:string}>{
        const payload = { sub: user._id, email: user.email, role: user.role };
        const accessToken = await this._jwtService.signAsync(payload, {
            secret: this._configService.get<string>('ACCESS_TOKEN_SECRET'),
            expiresIn: '15m',
        });
        const refreshToken = await this._jwtService.signAsync(payload, {
            secret: this._configService.get<string>('REFRESH_TOKEN_SECRET'),
            expiresIn: '7d',
        });
        return { accessToken, refreshToken };
    }

    setRefreshTokenCookie(response: Response, refreshToken: string): void {
        response.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: this._configService.get<string>('NODE_ENV') === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }
}
