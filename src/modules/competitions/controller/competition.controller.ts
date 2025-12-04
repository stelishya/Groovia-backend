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
} from '@nestjs/common';
import { CompetitionService } from '../services/competition.service';
import { JwtAuthGuard } from '../../auth/guards/jwtAuth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { ActiveUser } from '../../../common/decorators/active-user.decorator';
import { CreateCompetitionDto } from '../dto/create-competition.dto';
import { UpdateCompetitionDto } from '../dto/update-competition.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('competitions')
@UseGuards(JwtAuthGuard)
export class CompetitionController {
  constructor(private readonly competitionService: CompetitionService) { }

  @Post()
  @Roles(Role.ORGANIZER)
  @UseInterceptors(FileInterceptor('posterImage'))
  create(
    @Body() body: any, // Use 'any' for FormData, we'll validate manually
    @ActiveUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log("ith comp controller, body:", body);
    console.log("file:", file);

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
      posterImage: file ? file.originalname : (body.posterImage || ''), // Use uploaded file name or base64
      fee: Number(body.fee),
      date: body.date,
      registrationDeadline: body.registrationDeadline,
      maxParticipants: Number(body.maxParticipants),
    };

    return this.competitionService.create(createCompetitionDto, userId);
  }

  @Get()
  findAll(@Query('category') category?: string, @Query('style') style?: string) {
    if (category) {
      return this.competitionService.findByCategory(category);
    }
    if (style) {
      return this.competitionService.findByStyle(style);
    }
    return this.competitionService.findAll();
  }

  @Get('active')
  findActiveCompetitions() {
    return this.competitionService.findActiveCompetitions();
  }

  @Get('my-competitions')
  @Roles(Role.ORGANIZER)
  findMyCompetitions(@ActiveUser('sub') userId: string) {
    return this.competitionService.findByOrganizer(userId);
  }

  @Get('my-registrations')
  @Roles(Role.DANCER)
  findMyRegistrations(@ActiveUser('sub') userId: string) {
    return this.competitionService.findRegisteredCompetitions(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.competitionService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ORGANIZER)
  update(@Param('id') id: string, @Body() updateCompetitionDto: UpdateCompetitionDto) {
    return this.competitionService.update(id, updateCompetitionDto);
  }

  @Delete(':id')
  @Roles(Role.ORGANIZER)
  remove(@Param('id') id: string) {
    return this.competitionService.remove(id);
  }

  @Post(':id/register')
  @Roles(Role.DANCER)
  registerForCompetition(
    @Param('id') competitionId: string,
    @ActiveUser('sub') dancerId: string,
  ) {
    return this.competitionService.registerDancer(competitionId, dancerId);
  }

  @Patch(':id/payment/:dancerId')
  @Roles(Role.ORGANIZER)
  updatePaymentStatus(
    @Param('id') competitionId: string,
    @Param('dancerId') dancerId: string,
    @Body('paymentStatus') paymentStatus: string,
  ) {
    return this.competitionService.updatePaymentStatus(competitionId, dancerId, paymentStatus);
  }

  @Patch(':id/score/:dancerId')
  @Roles(Role.ORGANIZER)
  updateScore(
    @Param('id') competitionId: string,
    @Param('dancerId') dancerId: string,
    @Body('score') score: number,
  ) {
    return this.competitionService.updateScore(competitionId, dancerId, score);
  }

  @Post(':id/finalize')
  @Roles(Role.ORGANIZER)
  finalizeResults(
    @Param('id') competitionId: string,
    @Body('results') results: any,
  ) {
    return this.competitionService.finalizeResults(competitionId, results);
  }

  @Post(':id/initiate-payment')
  @Roles(Role.DANCER)
  initiatePayment(
    @Param('id') competitionId: string,
    @ActiveUser('sub') dancerId: string,
    @Body() body: { amount: number; currency: string },
  ) {
    return this.competitionService.initiatePayment(competitionId, dancerId, body.amount, body.currency);
  }

  @Post(':id/confirm-payment')
  @Roles(Role.DANCER)
  confirmPayment(
    @Param('id') competitionId: string,
    @ActiveUser('sub') dancerId: string,
    @Body() body: { paymentId: string; orderId: string; signature: string; amount: number },
  ) {
    return this.competitionService.confirmPayment(
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
        console.log('markPaymentFailed called with:',id);
        await this.competitionService.markPaymentFailed(id, req.user.userId);
        return { success: true, message: 'Payment marked as failed' };
    }
}
