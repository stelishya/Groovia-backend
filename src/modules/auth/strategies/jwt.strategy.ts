import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../services/token.service';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
   private readonly logger = new Logger(JwtStrategy.name);
  constructor(private readonly configService: ConfigService) {
    console.log("JWT_SECRET used in strategy: ", configService.get<string>('JWT_SECRET'));
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
    const secret = configService.get<string>('JWT_SECRET');
    console.log("JWT_SECRET used in strategy: ", secret);
this.logger.debug(`JWT_SECRET used in strategy: ${secret}`);
  }

  validate(payload: TokenPayload): TokenPayload {
    console.log("payload in jwt-strategy: ", payload);
    return {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
    };
  }
}