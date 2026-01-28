import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsUrl,
  IsEmail,
} from 'class-validator';
import { UpgradeRequestDocument } from '../models/upgrade-request.schema';

export class CreateUpgradeRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  danceStyles?: string[];

  @IsNumber()
  @IsOptional()
  experienceYears?: number;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  portfolioLinks?: string;

  @IsString()
  @IsOptional()
  certificateUrl?: string;

  @IsString()
  @IsOptional()
  organizationName?: string;

  @IsNumber()
  @IsOptional()
  pastEventsCount?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  licenseDocumentUrl?: string;

  @IsBoolean()
  @IsOptional()
  availableForWorkshops?: boolean;

  @IsString()
  @IsOptional()
  preferredLocation?: string;

  @IsString()
  @IsOptional()
  additionalMessage?: string;
}
export interface PaymentOrderResponse {
  id: string;
  [key: string]: unknown; // Allow additional Razorpay properties safely
}

export interface PaymentConfirmationResponse {
  success: boolean;
}

export interface PaymentFailedResponse {
  message: string;
  request: UpgradeRequestDocument;
}

export interface UserUpgradeRequestResponse {
  id: string;
  type: 'instructor' | 'organizer';
  status: string;
  paymentStatus: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  adminMessage?: string;
}
