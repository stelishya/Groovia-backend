import { IsString, IsNotEmpty, IsMongoId, IsDateString } from 'class-validator';

export class CreateRequestDto {
  @IsMongoId()
  @IsNotEmpty()
  dancerId: string;

  @IsString()
  @IsNotEmpty()
  event: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  venue: string;

  @IsString()
  @IsNotEmpty()
  budget: string;
}

export class updateBookingStatusDto{
  @IsString()
  @IsNotEmpty()
  status: string;
}