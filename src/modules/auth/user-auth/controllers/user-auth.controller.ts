import {
  Controller,
  Post,
  Body,
  Res,
  HttpCode,
  // HttpStatus,
  Inject,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { User } from '../../../users/models/user.schema';
import type { IUserAuthService } from '../interfaces/user-auth.service.interface';
import { IUserAuthServiceToken } from '../interfaces/user-auth.service.interface';
import type {
  VerifyOtpDto,
  SignupDto,
  ChangePasswordDto,
} from '../dto/user-auth.dto';
import { Public } from '../../../../common/decorators/public.decorator';
import { HttpStatus } from 'src/common/enums/http-status.enum';

import { JwtAuthGuard } from '../../jwt/guards/jwtAuth.guard';

@Controller('auth/user')
export class UserAuthController {
  constructor(
    @Inject(IUserAuthServiceToken)
    private readonly _userAuthService: IUserAuthService,
  ) {}

  @Public()
  @Post('login')
  async login(
    @Body() loginData: Partial<User>,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('loginData in userauth controller.ts', loginData);
    if (loginData.email && loginData.password) {
      return await this._userAuthService.login(
        loginData.email,
        loginData.password,
        res,
      );
    }
  }

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupDto: SignupDto) {
    return await this._userAuthService.signup(signupDto);
  }

  @Public()
  @Post('resend-otp')
  async resendOtp(@Body() body: { email: string }) {
    return await this._userAuthService.resendOtp(body.email);
  }

  @Public()
  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    try {
      const { email, otp } = verifyOtpDto;
      if (!email || !otp) {
        return {
          success: false,
          error: {
            message: 'Email and OTP are required',
            fieldMissing: true,
          },
        };
      }
      console.log(email, otp);
      const result = await this._userAuthService.verifyOtp(email, otp);
      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Verification failed',
          verificationFailed: true,
        },
      };
    }
  }

  @Public()
  @Post('forgot-password')
  async sendPasswordResetLink(@Body() body: { email: string }) {
    return await this._userAuthService.forgotPassword(body.email);
  }

  // @Public()
  // @Post('verify-reset-otp')
  // async verifyPasswordResetOtp(@Body() body:{email:string,otp:string}){
  //     return await this._userAuthService.verifyOtp(body.email,body.otp)
  // }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; password: string }) {
    console.log(
      'resetting password in resetPassword in user-auth.controller.ts',
      body,
    );
    return await this._userAuthService.resetPassword(body.token, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req()
    req: Request & {
      user: { userId: string; email: string; username: string };
    },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return await this._userAuthService.changePassword(
      req.user.userId,
      changePasswordDto,
    );
  }
}
