import { IsString, IsNotEmpty, IsEnum, IsDateString, IsNumber, IsOptional, ValidateNested, IsArray, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkshopMode } from '../models/workshop.schema';

class SessionDto {
    @IsDateString()
    @IsNotEmpty()
    date: Date;

    @IsString()
    @IsNotEmpty()
    startTime: string;

    @IsString()
    @IsNotEmpty()
    endTime: string;
}

export class CreateWorkshopDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    style: string;

    @IsEnum(WorkshopMode)
    @IsNotEmpty()
    mode: WorkshopMode;

    @IsDateString()
    @IsNotEmpty()
    startDate: Date;

    @IsDateString()
    @IsNotEmpty()
    endDate: Date;

    @IsNumber()
    @IsNotEmpty()
    fee: number;

    @IsNumber()
    @IsNotEmpty()
    maxParticipants: number;

    @IsString()
    @IsNotEmpty()
    posterImage: string;

    @IsString()
    @IsOptional()
    location?: string;

    @IsUrl()
    @IsOptional()
    meetingLink?: string;

    @IsDateString()
    @IsNotEmpty()
    deadline: Date;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SessionDto)
    sessions: SessionDto[];
}

export class WorkshopBookingDto {
    @IsString()
    @IsNotEmpty()
    workshopId: string;
}