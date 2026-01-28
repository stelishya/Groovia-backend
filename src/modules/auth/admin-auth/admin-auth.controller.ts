import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Logger,
  Post,
  Res,
} from '@nestjs/common';
import { type Response } from 'express';
import {
  type IAdminAuthService,
  IAdminAuthServiceToken,
} from './interfaces/admin-auth.service.interface';
import { Public } from 'src/common/decorators/public.decorator';
import { AdminLoginDto, AdminLoginResponseDto } from './dto/admin-auth.dto';
import { Admin } from 'src/modules/admins/models/admins.schema';
import { HttpStatus } from 'src/common/enums/http-status.enum';

@Controller('auth/admin')
export class AdminAuthController {
  private readonly _logger = new Logger(AdminAuthController.name);
  constructor(
    @Inject(IAdminAuthServiceToken)
    private readonly _adminAuthService: IAdminAuthService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginData: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminLoginResponseDto> {
    if (!loginData) {
      throw new BadRequestException('Invalid login data');
    }
    return await this._adminAuthService.login(
      loginData.email,
      loginData.password,
      res,
    );
  }

  @Public()
  @Post('register')
  async register(
    @Body() registerData: { username: string; password: string },
  ): Promise<Admin> {
    return this._adminAuthService.register(registerData);
  }
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    this._logger.log('Admin logout request');
    return await this._adminAuthService.logout(res);
  }
}
