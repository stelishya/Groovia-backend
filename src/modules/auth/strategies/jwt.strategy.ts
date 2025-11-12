import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../services/token.service';
import { type IUserService, IUserServiceToken } from 'src/modules/users/interfaces/services/user.service.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(
    private readonly configService: ConfigService,
    @Inject(IUserServiceToken) private readonly _userService: IUserService,
  ) {
    console.log('JWT_SECRET used in strategy: ', configService.get<string>('JWT_SECRET'));
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
    const secret = configService.get<string>('JWT_SECRET');
    console.log('JWT_SECRET used in strategy: ', secret);
    this.logger.debug(`JWT_SECRET used in strategy: ${secret}`);
  }

  async validate(payload: TokenPayload): Promise<{ userId: string; email: string; username?: string; role?: string[] }> {
    console.log('payload in validate in jwt-strategy: ', payload);

    const user = await this._userService.findById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.isBlocked) {
      throw new UnauthorizedException('User account is blocked');
    }

    return {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      // Attach role if needed by controllers/guards
      role: Array.isArray((user as any).role) ? (user as any).role : undefined,
    };
  }
}