import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsMongoId, IsDateString, registerDecorator, ValidationOptions, ValidationArguments, IsOptional, IsEmail, Min, IsNumber, MinLength, MaxLength, Matches } from 'class-validator';

// Custom validator to check if date is in the future
function IsDateInFuture(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDateInFuture',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return false;
          const inputDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return inputDate > today;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Event date must be in the future';
        },
      },
    });
  };
}

export class CreateRequestDto {
  @IsMongoId()
  @IsNotEmpty()
  dancerId: string;

  @IsString()
  @IsNotEmpty()
  event: string;

  @IsDateString()
  @IsNotEmpty()
  @IsDateInFuture()
  date: string;

  @IsString()
  @IsNotEmpty()
  venue: string;

  @IsString()
  @IsNotEmpty()
  budget: string;
}

export class updateBookingStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Booking amount cannot be negative' })
  amount?: number;
}

export class UpdateClientProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(24)
  @Matches(/^[a-zA-Z]+$/, { message: 'Username must contain only letters' })
  username?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: "1234567890" })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{10}$/, { message: 'Phone number must be exactly 10 digits' })
  phone?: string;

  @ApiPropertyOptional({ example: "https://s3.amazonaws.com/bucket/profile.jpg" })
  @IsString()
  @IsOptional()
  profileImage?: string;

  @ApiPropertyOptional({ example: 'Dance enthusiast' })
  @IsString()
  @IsOptional()
  bio?: string;
}