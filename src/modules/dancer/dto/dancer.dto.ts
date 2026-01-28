import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Types } from 'mongoose';

export class UpdateDancerProfileDto {
  @ApiPropertyOptional({ example: 'johndoe' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: 'Passionate dancer with 5 years of experience',
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  experienceYears?: number;

  @ApiPropertyOptional({
    example: ['https://instagram.com/dancer', 'https://youtube.com/dancer'],
  })
  @IsArray()
  @IsOptional()
  portfolioLinks?: string[];

  @ApiPropertyOptional({ example: ['Hip Hop', 'Contemporary', 'Ballet'] })
  @IsArray()
  @IsOptional()
  danceStyles?: string[];

  @ApiPropertyOptional({ example: 'New York' })
  @IsString()
  @IsOptional()
  preferredLocation?: string;

  @ApiPropertyOptional({ example: 'Female' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({
    example: { 'Hip Hop': 'Advanced', Ballet: 'Intermediate' },
  })
  @IsOptional()
  danceStyleLevels?: { [key: string]: string };

  @ApiPropertyOptional({
    example: [
      {
        awardName: 'National Dance Championship',
        position: '1st Place',
        year: 2023,
      },
      { awardName: 'Regional Competition', position: 'Winner', year: 2022 },
    ],
  })
  @IsArray()
  @IsOptional()
  achievements?: Array<{
    awardName: string;
    position: string;
    year: number | string;
  }>;

  @ApiPropertyOptional({
    example: [
      {
        name: 'Advanced Ballet Certification',
        url: 'https://drive.google.com/file/d/...',
      },
      {
        name: 'Hip-Hop Instructor License',
        url: 'https://drive.google.com/file/d/...',
      },
    ],
  })
  @IsArray()
  @IsOptional()
  certificates?: Array<{ name: string; url: string; fileType?: string }>;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  availableForPrograms?: boolean;

  @ApiPropertyOptional({
    example: 'https://s3.amazonaws.com/bucket/profile.jpg',
  })
  @IsString()
  @IsOptional()
  profileImage?: string;
}

export class CreateReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Amazing dancer! Very professional and talented.' })
  @IsString()
  comment: string;
}

export class CertificateDto {
  @ApiProperty({ example: 'Advanced Ballet Certification' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://drive.google.com/file/d/...' })
  @IsString()
  url: string;

  @ApiProperty({ example: 'pdf' })
  @IsString()
  fileType?: string;
}
