import {
  Controller,
  Get,
  Query,
  Request,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { IPaymentsServiceToken } from './interfaces/payments.service.interface';
import type { IPaymentsService } from './interfaces/payments.service.interface';
import { JwtAuthGuard } from '../auth/jwt/guards/jwtAuth.guard';

@Controller('users/payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    @Inject(IPaymentsServiceToken)
    private readonly paymentsService: IPaymentsService,
  ) {}

  @Get('history')
  async getHistory(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return await this.paymentsService.getHistory(req.user.userId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      search,
      type,
      status,
      sortBy,
    });
  }
}
