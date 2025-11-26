export interface VerifyOtpDto {
    email: string;
    otp: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface SignupDto {
    username: string;
    email: string;
    // phone:string;
    role: ('dancer' | 'client')[];
    password: string;
    confirmPassword: string;
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