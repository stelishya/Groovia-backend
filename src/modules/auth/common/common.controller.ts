import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Post,
    Put,
    Query,
    Req,
    Res,
    UseGuards,
    // HttpStatus,
  } from '@nestjs/common';
  import { Logger } from '@nestjs/common';
  import type{ Response, Request } from 'express';
  import { Types } from 'mongoose';
  import {
    type ICommonService,
    ICommonServiceToken,
  } from './interfaces/common-service.interface';
import { Public } from 'src/common/decorators/public.decorator';
import { HttpStatus } from 'src/common/enums/http-status.enum';
  
  @Controller('auth')
  export class CommonController {
    private readonly _logger = new Logger(CommonController.name);
    constructor(
      @Inject(ICommonServiceToken)
      private readonly _commonService: ICommonService,
    ) {}
  
    @Public()
    @Delete('logout')
    async userLogout(
      @Req() req: Request,
      @Res() res: Response,
    ) {
      this._logger.log(`Logout called`);

      await this._commonService.logoutHandler(req, res);
    }
  
    @Public()
    @Post('common/google')
    async authGoogle(@Body() body: { credential: string; role: 'client'|'dancer'  }, @Res() res: Response) {
      if (!body.credential) {
        throw new BadRequestException('No credential provided');
      } else {
        const resp = await this._commonService.handleGoogleAuth(
          body.credential,
          res,
          body.role
        );
        return res.status(HttpStatus.OK).json(resp);
      }
    }

    @Public()
    @Post('refresh-token')
    async refreshToken(
      @Req() req: Request,
      @Res() res: Response,
    ) {
      this._logger.log('Refresh token endpoint called');
      
      const refreshToken = req.cookies['refreshToken'];
      
      if (!refreshToken) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          message: 'Refresh token not found',
          isRefreshTokenExpired: true,
        });
      }

      try {
        const result = await this._commonService.refreshAccessToken(refreshToken);
        
        // Set new refresh token cookie
        this._commonService.setRefreshTokenCookie(res, result.refreshToken);
        
        return res.status(HttpStatus.OK).json({
          accessToken: result.accessToken,
          message: 'Token refreshed successfully',
        });
      } catch (error) {
        this._logger.error(`Token refresh failed: ${error.message}`);
        return res.status(HttpStatus.UNAUTHORIZED).json({
          message: error.message || 'Invalid refresh token',
          isRefreshTokenExpired: true,
        });
      }
    }
  }