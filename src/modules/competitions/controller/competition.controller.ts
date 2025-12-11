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
  UploadedFile,
  UploadedFiles,
  Inject,
} from '@nestjs/common';
// import { CompetitionService } from '../services/competition.service';
import { JwtAuthGuard } from '../../auth/guards/jwtAuth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { ActiveUser } from '../../../common/decorators/active-user.decorator';
import { CreateCompetitionDto } from '../dto/create-competition.dto';
import { UpdateCompetitionDto } from '../dto/update-competition.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import {type ICompetitionService, ICompetitionServiceToken } from '../interfaces/competition.service.interface';

@Controller('competitions')
@UseGuards(JwtAuthGuard)
export class CompetitionController {
  constructor(
    @Inject(ICompetitionServiceToken)
    private readonly _competitionService: ICompetitionService,
    // private readonly competitionService: CompetitionService
  ) { }

  @Post()
  @Roles(Role.ORGANIZER)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'posterImage', maxCount: 1 },
    { name: 'document', maxCount: 1 }
  ]))
  create(
    @Body() body: any,
    @ActiveUser('userId') userId: string,
    @UploadedFiles() files: { posterImage?: Express.Multer.File[], document?: Express.Multer.File[] },
  ) {

    // Construct DTO from form data
    const createCompetitionDto: CreateCompetitionDto = {
      title: body.title,
      description: body.description,
      category: body.category,
      style: body.style,
      level: body.level,
      age_category: body.age_category,
      mode: body.mode,
      duration: body.duration,
      location: body.location,
      meeting_link: body.meeting_link,
      posterImage: body.posterImage || '',
      fee: Number(body.fee),
      date: body.date,
      registrationDeadline: body.registrationDeadline,
      maxParticipants: Number(body.maxParticipants),
    };

    return this._competitionService.create(
      createCompetitionDto,
      userId,
      files?.posterImage?.[0],
      files?.document?.[0],
    );
  }

  @Get()
  findAll(@Query('category') category?: string, @Query('style') style?: string) {
    if (category) {
      return this._competitionService.findByCategory(category);
    }
    if (style) {
      return this._competitionService.findByStyle(style);
    }
    return this._competitionService.findAll();
  }

  @Get('active')
  findActiveCompetitions() {
    return this._competitionService.findActiveCompetitions();
  }

  @Get('my-competitions')
  @Roles(Role.ORGANIZER)
  findMyCompetitions(@Request() req) {
    console.log("organizer nte id:", req.user.userId);
    return this._competitionService.findByOrganizer(req.user.userId);
  }

  @Get('my-registrations')
  @Roles(Role.DANCER)
  findMyRegistrations(@ActiveUser('userId') userId: string) {
    return this._competitionService.findRegisteredCompetitions(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this._competitionService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ORGANIZER)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'posterImage', maxCount: 1 },
    { name: 'document', maxCount: 1 }
  ]))
  update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles() files: { posterImage?: Express.Multer.File[], document?: Express.Multer.File[] },
  ) {
    // Construct DTO from form data
    const updateCompetitionDto: any = {
      title: body.title,
      description: body.description,
      category: body.category,
      style: body.style,
      level: body.level,
      age_category: body.age_category,
      mode: body.mode,
      duration: body.duration,
      location: body.location,
      meeting_link: body.meeting_link,
      posterImage: body.posterImage || '',
      fee: body.fee ? Number(body.fee) : undefined,
      date: body.date,
      registrationDeadline: body.registrationDeadline,
      maxParticipants: body.maxParticipants ? Number(body.maxParticipants) : undefined,
    };

    // Remove undefined values
    Object.keys(updateCompetitionDto).forEach(key =>
      updateCompetitionDto[key] === undefined && delete updateCompetitionDto[key]
    );

    console.log("Update Controller - Files received:", files);
    console.log("Update Controller - Document file:", files?.document?.[0]);
    console.log("Update Controller - DTO:", updateCompetitionDto);

    return this._competitionService.update(
      id,
      updateCompetitionDto,
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
    return this._competitionService.updatePaymentStatus(competitionId, dancerId, paymentStatus);
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
    @Body('results') results: any,
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
    return this._competitionService.initiatePayment(competitionId, dancerId, body.amount, body.currency);
  }

  @Post(':id/confirm-payment')
  @Roles(Role.DANCER)
  confirmPayment(
    @Param('id') competitionId: string,
    @ActiveUser('userId') dancerId: string,
    @Body() body: { paymentId: string; orderId: string; signature: string; amount: number },
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
  async markFailedPayment(@Param('id') id: string, @Request() req) {
    console.log('markPaymentFailed called with:', id);
    await this._competitionService.markPaymentFailed(id, req.user.userId);
    return { success: true, message: 'Payment marked as failed' };
  }
}
