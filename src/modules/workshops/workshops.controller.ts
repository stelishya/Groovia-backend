import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkshopsService } from './workshops.service';
import { CreateWorkshopDto, GetWorkshopsDto } from './dto/workshop.dto';
import { type FilterQuery } from 'mongoose';
import { Workshop } from './models/workshop.schema';
import { JwtAuthGuard } from '../auth/jwt/guards/jwtAuth.guard';
// import { RolesGuard } from '../../auth/guards/roles.guard';
// import { Roles } from '../../auth/decorators/roles.decorator';

import {
  type IWorkshopService,
  IWorkshopServiceToken,
  WorkshopFilters,
} from './interfaces/workshop.service.interface';

@Controller('workshops')
export class WorkshopsController {
  constructor(
    @Inject(IWorkshopServiceToken)
    private readonly _workshopsService: IWorkshopService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('posterImage'))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateWorkshopDto,
    @Request() req,
  ) {
    return this._workshopsService.create(body, file, req.user.userId);
  }

  @Get('instructor')
  @UseGuards(JwtAuthGuard)
  getInstructorWorkshops(@Request() req) {
    return this._workshopsService.getInstructorWorkshops(req.user.userId);
  }

  @Get('booked')
  @UseGuards(JwtAuthGuard)
  getBookedWorkshops(
    @Request() req,
    @Query('search') search?: string,
    @Query('style') style?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    console.log('ivda vaa');
    return this._workshopsService.getBookedWorkshops(req.user.userId, {
      search,
      style,
      sortBy,
      page,
      limit,
    });
  }

  @Get('')
  findAll(@Query() query: GetWorkshopsDto) {
    const filters: WorkshopFilters = {
      ...query,
      limit: query.limit ? parseInt(query.limit) : 10,
      page: query.page ? parseInt(query.page) : 1,
      skipTotal: query.skipTotal === 'true',
    };
    console.log('Fetching workshops with filters:', filters);
    return this._workshopsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this._workshopsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('posterImage'))
  update(
    @Param('id') id: string,
    @Body() updateWorkshopDto: Partial<CreateWorkshopDto>,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this._workshopsService.update(id, updateWorkshopDto, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this._workshopsService.remove(id);
  }

  @Post(':id/initiate-booking')
  @UseGuards(JwtAuthGuard)
  initiateBooking(@Param('id') id: string, @Request() req) {
    return this._workshopsService.initiateWorkshopBooking(id, req.user.userId);
  }

  @Post(':id/confirm-booking')
  @UseGuards(JwtAuthGuard)
  confirmBooking(
    @Param('id') id: string,
    @Body() body: { paymentId: string; orderId: string; signature: string },
    @Request() req,
  ) {
    return this._workshopsService.confirmWorkshopBooking(
      id,
      req.user.userId,
      body.paymentId,
      body.orderId,
      body.signature,
    );
  }

  @Post(':id/mark-payment-failed')
  @UseGuards(JwtAuthGuard)
  async markFailedPayment(@Param('id') id: string, @Request() req) {
    console.log('markPaymentFailed called with:', id);
    await this._workshopsService.markPaymentFailed(id, req.user.userId);
    return { success: true, message: 'Payment marked as failed' };
  }
}
