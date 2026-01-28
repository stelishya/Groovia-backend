import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsOptional,
  IsUrl,
  Min,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Types } from 'mongoose';
import { Type } from 'class-transformer';
import {
  CompetitionCategory,
  CompetitionLevel,
  CompetitionMode,
} from '../models/competition.schema';

export class CreateCompetitionDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsEnum(CompetitionCategory)
  category: CompetitionCategory;

  @IsNotEmpty()
  @IsString()
  style: string;

  @IsNotEmpty()
  @IsEnum(CompetitionLevel)
  level: CompetitionLevel;

  @IsNotEmpty()
  @IsString()
  age_category: string;

  @IsNotEmpty()
  @IsEnum(CompetitionMode)
  mode: CompetitionMode;

  @IsNotEmpty()
  @IsString()
  duration: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsUrl()
  meeting_link?: string;

  @IsNotEmpty()
  @IsString()
  posterImage: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  fee: number;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsNotEmpty()
  @IsDateString()
  registrationDeadline: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  maxParticipants: number;
}
export interface PopulatedUser {
  _id: Types.ObjectId;
  profileImage?: string | undefined;
  username?: string;
  email?: string;
}
export interface RegisteredDancerItem {
  dancerId: Types.ObjectId | PopulatedUser;
  paymentStatus: string;
  score: number;
  registeredAt: Date;
}
