import { BadRequestException, HttpStatus, Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { User } from 'src/modules/users/models/user.schema';
import { ICommonService } from './interfaces/common-service.interface';
import { OAuth2Client } from 'google-auth-library';
// import { type IUserService, IUserServiceToken } from 'src/modules/users/interfaces/services/user.service.interface';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { RedisService } from 'src/common/redis/redis.service';

@Injectable()
export class CommonService implements ICommonService{
    private readonly _logger= new Logger(CommonService.name)
    private _googleClient:OAuth2Client
    constructor(
        // @Inject(IUserServiceToken)
        // private readonly _userService:IUserService,
        private readonly _jwtService:JwtService,
        private readonly _configService:ConfigService,
        private readonly _redisService:RedisService,
    ){
        this._googleClient = new OAuth2Client(
            this._configService.get<string>('GOOGLE_CLIENT_ID'),
        )
    }
    async logoutHandler(req: Request, res: Response): Promise<void> {
        const cookieName = 'refreshToken';
        const accessToken = req.headers.authorization?.split(' ')[1];
        const refreshToken = req.cookies[cookieName];
        try {
            if(accessToken){
                await this._blacklistToken(accessToken);
            }
            if(refreshToken){
                await this._blacklistToken(refreshToken);
            }
            res.clearCookie(cookieName,{
                httpOnly:true,
                secure:process.env.NODE_ENV === 'production',
                sameSite:'strict',
            });
            this._logger.log(`Logout service called, cleared cookie: ${cookieName}`)
            console.log(`Logout service called, cleared cookie: ${cookieName}`)
            res.status(HttpStatus.OK).json({message:'User logged out successfully'})
        } catch (error) {
            this._logger.error(`Logout service failed: ${error.message}`)
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({message:'Logout failed'})
        }
    }
    // google authentication
//     async handleGoogleAuth(
//     credential: string,
//     res: Response,
//   ): Promise<{ accessToken: string; message: string }> {
//     try {
//       const ticket = await this._googleClient.verifyIdToken({
//         idToken: credential,
//         audience: this._configService.get<string>('GOOGLE_CLIENT_ID'),
//       });

//       const payload = ticket.getPayload();

//       if (!payload || !payload.email) {
//         throw new BadRequestException('Invalid Google Token');
//       }

//       const {
//         email,
//         name: fullname,
//         email_verified,
//         sub: googleId,
//         locale,
//         picture: profileImage,
//       } = payload;
//       if (!email_verified) {
//         throw new BadRequestException('Email not verified');
//       }

//       const language = this._convertToLanguageEnum(locale);

//       let user: User | null = await this._userService.findByEmail(email);
//       if (!user) {
//         user = await this._userService.createGoogleUser({
//           email,
//           fullname,
//           googleId,
//           language,
//           profileImage,
//         });
//       }

//       if (user && !user.googleId) {
//         user = await this._userService.updateUserGoogleId(user._id, googleId);
//       }
//       if (user) {
//         const { accessToken, refreshToken } = await this.generateToken(
//           user,
//           user.isEditor ? Role.CLIENT : Role.DANCER,
//         );

//         this.setRefreshTokenCookie(res, refreshToken);

//         return {
//           accessToken,
//           message: 'Google sign-in successful',
//         };
//       } else {
//         throw new InternalServerErrorException('Unable to sign in via Google');
//       }
//     } catch (error) {
//       throw new BadRequestException('Invalid google Token');
//     }
//   }

    async generateToken(user:User):Promise<{accessToken:string,refreshToken:string}>{
        const payload = { userId: user._id, email: user.email, role: user.role };
        const accessToken = await this._jwtService.signAsync(payload, {
            secret: this._configService.get<string>('JWT_SECRET'),
            expiresIn: '1d',
        });
        const refreshToken = await this._jwtService.signAsync(payload, {
            secret: this._configService.get<string>('JWT_SECRET'),
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

    private async _blacklistToken(token: string): Promise<void> {
    try {
      const decoded: JwtPayload = this._jwtService.decode(token);
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          const key = `blacklist:${token}`;
          await this._redisService.client.set(key, 'true', { EX: ttl });
          this._logger.log(`Token blacklisted with TTL: ${ttl}s`);
        }
      }
    } catch (error) {
      this._logger.error(`Failed to blacklist token: ${error.message}`);
    }
  }
}
