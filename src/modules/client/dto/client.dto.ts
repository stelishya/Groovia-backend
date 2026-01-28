import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsDateString,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  IsOptional,
  IsEmail,
} from 'class-validator';

// Custom validator to check if date is in the future
function IsDateInFuture(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDateInFuture',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (!value) return false;
          if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
            return false;
          }
          const inputDate = new Date(value as string | number | Date);
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
  // @IsNumber() // Ensure you import IsNumber if you want validation
  amount?: number;
}

export class UpdateClientProfileDto {
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: 'https://s3.amazonaws.com/bucket/profile.jpg',
  })
  @IsString()
  @IsOptional()
  profileImage?: string;

  @ApiPropertyOptional({ example: 'Dance enthusiast' })
  @IsString()
  @IsOptional()
  bio?: string;
}
