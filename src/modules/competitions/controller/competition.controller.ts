import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt/guards/jwtAuth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { ActiveUser } from '../../../common/decorators/active-user.decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { type ICompetitionService, ICompetitionServiceToken } from '../interfaces/competition.service.interface';
import { CreateCompetitionDto } from '../dto/create-competition.dto';
import { UpdateCompetitionDto } from '../dto/update-competition.dto';

@Controller('competitions')
@UseGuards(JwtAuthGuard)
export class CompetitionController {
  constructor(
    @Inject(ICompetitionServiceToken)
    private readonly _competitionService: ICompetitionService,
  ) {}

  @Post()
  @Roles(Role.ORGANIZER)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'posterImage', maxCount: 1 },
      { name: 'document', maxCount: 1 },
    ]),
  )
  create(
    @Body() body: CreateCompetitionDto,
    @ActiveUser('userId') userId: string,
    @UploadedFiles()
    files: {
      posterImage?: Express.Multer.File[];
      document?: Express.Multer.File[];
    },
  ) {
    return this._competitionService.create(
      body,
      userId,
      files?.posterImage?.[0],
      files?.document?.[0],
    );
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('level') level?: string,
    @Query('style') style?: string,
    @Query('category') category?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this._competitionService.findAll({
      search,
      sortBy,
      level,
      style,
      category,
      page,
      limit,
    });
  }

  @Get('active')
  findActiveCompetitions() {
    return this._competitionService.findActiveCompetitions();
  }

  @Get('my-competitions')
  @Roles(Role.ORGANIZER)
  findMyCompetitions(
    @Request() req,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('level') level?: string,
    @Query('style') style?: string,
    @Query('category') category?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    console.log('organizer nte id:', req.user.userId);
    return this._competitionService.findByOrganizer(req.user.userId, {
      search,
      sortBy,
      level,
      style,
      category,
      page,
      limit,
    });
  }

  @Get('my-registrations')
  @Roles(Role.DANCER)
  findMyRegistrations(
    @ActiveUser('userId') userId: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('level') level?: string,
    @Query('style') style?: string,
    @Query('category') category?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this._competitionService.findRegisteredCompetitions(userId, {
      search,
      sortBy,
      level,
      style,
      category,
      page,
      limit,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this._competitionService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ORGANIZER)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'posterImage', maxCount: 1 },
      { name: 'document', maxCount: 1 },
    ]),
  )
  update(
    @Param('id') id: string,
    @Body() body: UpdateCompetitionDto,
    @UploadedFiles()
    files: {
      posterImage?: Express.Multer.File[];
      document?: Express.Multer.File[];
    },
  ) {
    return this._competitionService.update(
      id,
      body,
      files?.posterImage?.[0],
      files?.document?.[0],
    );
  }

  @Delete(':id')
  @Roles(Role.ORGANIZER)
  remove(@Param('id') id: string) {
    return this._competitionService.remove(id);
  }

  @Post(':id/register')
  @Roles(Role.DANCER)
  registerForCompetition(
    @Param('id') competitionId: string,
    @ActiveUser('userId') dancerId: string,
  ) {
    return this._competitionService.registerDancer(competitionId, dancerId);
  }

  @Patch(':id/payment/:dancerId')
  @Roles(Role.ORGANIZER)
  updatePaymentStatus(
    @Param('id') competitionId: string,
    @Param('dancerId') dancerId: string,
    @Body('paymentStatus') paymentStatus: string,
  ) {
    return this._competitionService.updatePaymentStatus(
      competitionId,
      dancerId,
      paymentStatus,
    );
  }

  @Patch(':id/score/:dancerId')
  @Roles(Role.ORGANIZER)
  updateScore(
    @Param('id') competitionId: string,
    @Param('dancerId') dancerId: string,
    @Body('score') score: number,
  ) {
    return this._competitionService.updateScore(competitionId, dancerId, score);
  }

  @Post(':id/finalize')
  @Roles(Role.ORGANIZER)
  finalizeResults(
    @Param('id') competitionId: string,
    @Body('results') results: Record<string, unknown>[],
  ) {
    return this._competitionService.finalizeResults(competitionId, results);
  }

  @Post(':id/initiate-payment')
  @Roles(Role.DANCER)
  initiatePayment(
    @Param('id') competitionId: string,
    @ActiveUser('userId') dancerId: string,
    @Body() body: { amount: number; currency: string },
  ) {
    return this._competitionService.initiatePayment(
      competitionId,
      dancerId,
      body.amount,
      body.currency,
    );
  }

  @Post(':id/confirm-payment')
  @Roles(Role.DANCER)
  confirmPayment(
    @Param('id') competitionId: string,
    @ActiveUser('userId') dancerId: string,
    @Body()
    body: {
      paymentId: string;
      orderId: string;
      signature: string;
      amount: number;
    },
  ) {
    return this._competitionService.confirmPayment(
      competitionId,
      dancerId,
      body.paymentId,
      body.orderId,
      body.signature,
      body.amount,
    );
  }

  @Post(':id/mark-payment-failed')
  @UseGuards(JwtAuthGuard)
  async markFailedPayment(
    @Param('id') id: string,
    @ActiveUser('userId') userId: string,
  ) {
    console.log('markPaymentFailed called with:', id);
    await this._competitionService.markPaymentFailed(id, userId);
    return { success: true, message: 'Payment marked as failed' };
  }
}
