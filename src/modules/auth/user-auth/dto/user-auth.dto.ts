import { IsString, IsEmail, MinLength, MaxLength, Matches, IsEnum, IsOptional, ArrayMinSize, IsArray } from 'class-validator';

export class VerifyOtpDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    @MaxLength(6)
    otp: string;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class SignupDto {
    @IsString()
    @MinLength(2)
    @MaxLength(24)
    @Matches(/^[a-zA-Z]+$/, { message: 'Username must contain only letters' })
    username: string;

    @IsEmail()
    email: string;

    @IsArray()
    @ArrayMinSize(1)
    @IsEnum(['dancer', 'client'], { each: true })
    role: ('dancer' | 'client')[];

    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!#%^_*?&])[A-Za-z\d@$!#%^_*?&]/, {
        message: 'Password must contain at least one letter, one number, and one special character (@$!#%^_*?&)'
    })
    password: string;

    @IsString()
    confirmPassword: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    @MaxLength(6)
    otp?: string;
}

// --- Response Types ---

export interface SignupResponse {
    success: boolean;
    message: string;
}

export interface VerificationResponse {
    success: boolean;
    data: {
        user: any;
    };
}

export interface VerifyOtpResponse {
    success: boolean;
    message?: string;
    verified?: boolean;
    error?: {
        message: string;
        otpInvalid: boolean;
    };
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}