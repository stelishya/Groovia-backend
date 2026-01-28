import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  role?: string[];
}

@Injectable()
export class TokenService {
  constructor(
    private readonly _jwtService: JwtService,
    private readonly _configService: ConfigService,
  ) { }

  async signAccessToken(payload: TokenPayload): Promise<string> {
    console.log('signAccessToken in token.service.ts !!');
    const options = this._getJwtOptions('ACCESS_TOKEN_EXPIRATION');
    return this._jwtService.signAsync(payload, options);
  }

  async signRefreshToken(payload: TokenPayload): Promise<string> {
    console.log('signRefreshToken in token.service.ts !!');
    const options = this._getJwtOptions('REFRESH_TOKEN_EXPIRATION');
    return this._jwtService.signAsync(payload, options);
  }

  async verifyRefreshToken(refreshToken: string): Promise<TokenPayload> {
    console.log('verifyRefreshToken in token.service.ts !!');
    return this._jwtService.verifyAsync(refreshToken, {
      secret: this._configService.get<string>('JWT_SECRET'),
    });
  }

  private _getJwtOptions(expiresInKey: string): JwtSignOptions {
    const expiresIn = this._configService.get<string>(expiresInKey);
    if (!expiresIn) {
      throw new Error(`JWT configuration ${expiresInKey} is required but not set`);
    }
    return {
      secret: this._configService.get<string>('JWT_SECRET'),
      expiresIn: expiresIn as unknown as number,
    };
  }
}
