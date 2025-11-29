import { PartialType } from '@nestjs/mapped-types';
import { CreateCompetitionDto } from './create-competition.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { CompetitionStatus } from '../models/competition.schema';

export class UpdateCompetitionDto extends PartialType(CreateCompetitionDto) {
  @IsOptional()
  @IsEnum(CompetitionStatus)
  status?: CompetitionStatus;
}
