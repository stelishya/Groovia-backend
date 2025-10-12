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
    HttpStatus,
  } from '@nestjs/common';
  import { Logger } from '@nestjs/common';
  import type{ Response, Request } from 'express';
  import { Types } from 'mongoose';
  
//   import { GetUser } from '../decorators/get-user.decorator';
//   import { Public } from '../decorators/public.decorator';
  
//   import { UserType } from './dtos/common.dto';

  import {
    type ICommonService,
    ICommonServiceToken,
  } from './interfaces/common-service.interface';
import { Public } from 'src/common/decorators/public.decorator';
  
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
    @Post('google')
    async authGoogle(@Body() body: { credential: string }, @Res() res: Response) {
      if (!body.credential) {
        throw new BadRequestException('No credential provided');
      } else {
        const resp = await this._commonService.handleGoogleAuth(
          body.credential,
          res,
        );
        res.status(HttpStatus.OK).json(resp);
      }
    }
  }