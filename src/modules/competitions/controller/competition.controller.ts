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
} from '@nestjs/common';
import { CompetitionService } from '../services/competition.service';
import { JwtAuthGuard } from '../../auth/guards/jwtAuth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../common/enums/role.enum';
import { ActiveUser } from '../../../common/decorators/active-user.decorator';
import { CreateCompetitionDto } from '../dto/create-competition.dto';
import { UpdateCompetitionDto } from '../dto/update-competition.dto';

@Controller('clients/competitions')
@UseGuards(JwtAuthGuard)
export class CompetitionController {
  constructor(private readonly competitionService: CompetitionService) {}

  @Post()
  @Roles(Role.ORGANIZER)
  create(
    @Body() createCompetitionDto: CreateCompetitionDto,
    @ActiveUser('sub') userId: string,
  ) {
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
}
