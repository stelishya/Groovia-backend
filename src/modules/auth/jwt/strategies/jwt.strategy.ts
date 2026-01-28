import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../services/token.service';
import {
  type IUserService,
  IUserServiceToken,
} from 'src/modules/users/interfaces/user.service.interface';
import {
  type IAdminService,
  IAdminServiceToken,
} from 'src/modules/admins/interfaces/admins.service.interface';
import { Role } from 'src/common/enums/role.enum';
import { Types } from 'mongoose';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(
    private readonly configService: ConfigService,
    @Inject(IUserServiceToken) private readonly _userService: IUserService,
    @Inject(IAdminServiceToken) private readonly _adminService: IAdminService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
    const secret = configService.get<string>('JWT_SECRET');
    // console.log('JWT_SECRET used in strategy: ', secret);
    // this.logger.debug(`JWT_SECRET used in strategy: ${secret}`);
  }

  async validate(payload: TokenPayload): Promise<{
    userId: string;
    email: string;
    username?: string;
    role?: string[];
  }> {
    console.log('payload in validate in jwt-strategy: ', payload);

    let user;
    let isAdmin = false;

    // Check if role indicates admin
    // Note: Adjust logic depending on how you store roles.
    // If exact string match 'admin' or enum:
    if (
      payload.role &&
      (payload.role.includes(Role.ADMIN) || payload.role.includes('admin'))
    ) {
      user = await this._adminService.findOne({
        _id: new Types.ObjectId(payload.userId),
      });
      isAdmin = true;
    } else {
      user = await this._userService.findById(payload.userId);
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check blocked status if it exists on the entity
    if (user.isBlocked) {
      throw new UnauthorizedException('User account is blocked');
    }

    const result = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username || user.name, // Admin might not have username same way
      role: isAdmin ? [Role.ADMIN] : user.role || [],
    };
    console.log('JWT strategy validate result:', result);
    return result;
  }
}
