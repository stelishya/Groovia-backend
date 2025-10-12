import { Response } from "express";
import { User } from "src/modules/users/models/user.schema";
import { SignupDto, SignupResponse, VerificationResponse, VerifyOtpResponse } from "../dto/user-auth.dto";

export const IUserAuthServiceToken = Symbol('IUserAuthService')

export interface IUserAuthService {
    login(
        email: string,
        password: string,
        res:Response,
    ): Promise<{user:User;accessToken:string}>;
    signup(
        signupDto:SignupDto,
    ): Promise<SignupResponse | VerificationResponse>;
    // verifySignup(verifySignupDto: SignupDto): Promise<{success:boolean; data:{user:User}}>;
    resendOtp(email:string): Promise<boolean>;
    verifyOtp(
        email:string,
        otp:string,
    ): Promise<VerifyOtpResponse>
    forgotPassword(email: string): Promise<{ success: boolean; message: string }>;
    resetPassword(token:string,newPassword:string): Promise<boolean>;
}