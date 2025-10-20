import { HttpException, HttpStatus, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type { IUserAuthService } from '../interfaces/user-auth.service.interface';
// import { IUserAuthServiceToken } from './interfaces/user-auth.service.interface';
import { Response } from 'express';
import { User } from 'src/modules/users/models/user.schema';
import type { IUserService } from 'src/modules/users/interfaces/services/user.service.interface';
import { IUserServiceToken } from 'src/modules/users/interfaces/services/user.service.interface';
import type { IHashingService } from 'src/common/hashing/interfaces/hashing.service.interface';
import { IHashingServiceToken } from 'src/common/hashing/interfaces/hashing.service.interface';
import type { ICommonService } from '../../common/interfaces/common-service.interface';
import { ICommonServiceToken } from '../../common/interfaces/common-service.interface';
import { type IOtpService, IOtpServiceToken } from '../interfaces/otp.service.interface';
import { MailService } from 'src/mail/mail.service';
import { SignupDto, SignupResponse, VerificationResponse, VerifyOtpResponse } from '../dto/user-auth.dto';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserAuthService implements IUserAuthService {
    private readonly _logger = new Logger(UserAuthService.name);

    constructor(
        @Inject(IUserServiceToken) private readonly _userService: IUserService,
        @Inject(IHashingServiceToken) private readonly _hashingService: IHashingService,
        @Inject(IOtpServiceToken) private readonly _otpService: IOtpService,
        @Inject(ICommonServiceToken)
        private readonly _commonService: ICommonService,
        private readonly _mailService: MailService,
        private readonly _configService: ConfigService
    ) { }

    async login(
        email: string,
        password: string,
        response: Response
    ): Promise<{ user: User; accessToken: string }> {
        try {
            console.log("HI, login in userauth service")
            this._logger.log(`Login attempt for email: ${email}`);
            const user = await this._userService.findOne({ email })
            console.log(`User object fetched from DB: ${JSON.stringify(user)}`);

            if (!user) {
                throw new UnauthorizedException('user not found')
            }
            const isPasswordValid = await this._hashingService.comparePassword(
                password,
                user.password,
            )
            if (!isPasswordValid) {
                throw new UnauthorizedException('invalid password')
            }
            if (user.isBlocked) {
                console.log("user is blocked")
                throw new UnauthorizedException('user is blocked')
            }
            const { accessToken, refreshToken } = await this._commonService.generateToken(user)
            this._commonService.setRefreshTokenCookie(response, refreshToken)
            return { user, accessToken };
        } catch (error) {
            this._logger.error(`Login failed for email: ${email}`, error.message);
            throw error;
        }
    }

    async signup(
        signupDto: SignupDto
        // username: string,
        // email: string,
        // phone:string,
        // role:string,
        // password: string,
        // confirmPassword: string,
    ): Promise<SignupResponse | VerificationResponse> {
        try {
            const { username, email, phone, role, password, confirmPassword, otp } = signupDto;
            if (otp) {
                console.log("otp in user auth service", otp)
                console.log(`[Signup Step 2] Attempting to verify OTP for ${email}`);
                const isValid = await this._otpService.verifyOtp(email, otp)
                if (!isValid) {
                    console.warn(`[Signup Step 2] Invalid OTP for ${email}`);
                    throw new HttpException('Invalid or expired OTP', HttpStatus.BAD_REQUEST)
                }
                console.log(`[Signup Step 2] OTP verified for ${email}. Attempting to create user.`);
                try{
                    const hashedPassword = await this._hashingService.hashPassword(password);
                    // const user = await this._userService.createUser({ username, email, phone, role, password:hashedPassword });
                     // Convert role to array since schema expects string[]
 const roleArray: string[] = Array.isArray(role) ? role : [role];
 const user = await this._userService.createUser({
 username,
 email,
 phone,
 role: roleArray,
 password: hashedPassword
 });
                    console.log(`[Signup Step 2] User created successfully for ${email}`);
                    return {
                        success: true,
                        data: { user }
                    }
                }catch (creationError) {
                    console.error(`[Signup Step 2] User creation FAILED for ${email}`, creationError.stack);
                    throw new HttpException('Failed to create user after verification.', HttpStatus.INTERNAL_SERVER_ERROR);
                }
            }
            console.log(`[Signup Step 1] New signup request for ${email}`);
            // console.log("without otp in user auth service")
            // this._logger.log('new signup request')
            if (!username) {
                throw new HttpException(
                    {
                        success: false,
                        error: {
                            message: 'Username is required',
                            usernameExists: false,
                            emailExists: false,
                        }
                    },
                    HttpStatus.BAD_REQUEST
                )
            }
            const existingUser = await this._userService.findByUsername(username)
            if (existingUser) {
                throw new HttpException(
                    {
                        success: false,
                        error: {
                            message: 'username already exists',
                            usernameExists: true,
                            emailExists: false
                        }
                    },
                    HttpStatus.BAD_REQUEST
                )
            }
            if (!email) {
                throw new HttpException(
                    {
                        success: false,
                        error: {
                            message: 'Email is required',
                            usernameExists: false,
                            emailExists: false
                        }
                    },
                    HttpStatus.BAD_REQUEST
                )
            }
            const existingEmail = await this._userService.findByEmail(email)
            if (existingEmail) {
                throw new HttpException(
                    {
                        success: false,
                        error: {
                            message: 'email already exists',
                            usernameExists: false,
                            emailExists: true
                        }
                    },
                    HttpStatus.BAD_REQUEST
                )
            }

            // const user = await this._userService.createUser({username,email,role,password})

            const newOtp = await this._otpService.createOtp(email)
            await this._mailService.sendOtpEmail(email, { otp: newOtp })

            return {
                success: true,
                message: 'Otp sent successfully. Please verify to complete signup..',
                // data:{
                //     user
                // }
            }
        } catch (error) {
            this._logger.error(`Signup process failed for ${signupDto.email}: ${error.message}`);
            console.log("An internal error occured while signup.", HttpStatus.INTERNAL_SERVER_ERROR)

            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                {
                    success: false,
                    error: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    // async verifySignup(verifySignupDto: VerifySignupDto): Promise<VerificationResponse> {
    //     try {
    //         const { username, email, otp, phone, password, role } = verifySignupDto;
    //         const isValid = await this._otpService.verifyOtp(email, otp);
    //         if (!isValid) {
    //             throw new HttpException(
    //                 {
    //                     success: false,
    //                     error: {
    //                         message: 'Invalid or expired OTP',
    //                         otpInvalid: true,
    //                     },
    //                 },
    //                 HttpStatus.BAD_REQUEST,
    //             );
    //         }

    //         const user = await this._userService.createUser({ username, email,phone, role, password });

    //         return {
    //             success: true,
    //             data: {
    //                 user,
    //             },
    //         };
    //     } catch (error) {
    //         this._logger.error(`User creation failed after OTP verification for email ${verifySignupDto.email}: ${error.message}`);
    //         throw new HttpException(
    //             {
    //                 success: false,
    //                 error: {
    //                     message: 'User creation failed after verification.',
    //                 },
    //             },
    //             HttpStatus.INTERNAL_SERVER_ERROR,
    //         );
    //     }
    // }

    async resendOtp(email: string): Promise<boolean> {
        try {
            const otp = await this._otpService.createOtp(email);
            await this._mailService.sendOtpEmail(email, { otp });
            return true;
        } catch (error) {
            this._logger.error(
                `Failed to resend OTP for email ${email}: ${error.message}`,
            );
            throw new HttpException(
                'Failed to resend OTP',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async verifyOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
        const isValid = await this._otpService.verifyOtp(email, otp);
        if (isValid) {
            await this._userService.updateOne({ email }, { isVerified: true });
            return {
                success: true,
                message: 'Email verified successfully',
                verified: true,
            };
        }
        return {
            success: false,
            error: {
                message: 'Invalid OTP',
                otpInvalid: true,
            },
        };
    }
    async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
            const user = await this._userService.findByEmail(email);
            if (!user) {
                // To prevent email enumeration, we don't reveal that the user doesn't exist.
                // We'll return a success-like message but do nothing.
                this._logger.warn(`Password reset attempt for non-existent email: ${email}`);
                return { success: true, message: 'If an account with this email exists, a password reset link has been sent.' };
            }
    
            // 1. Generate a secure token
            const resetToken = crypto.randomBytes(32).toString('hex');
    
            // 2. Hash the token before saving to the database for security
            // const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
            // 3. Set an expiration date (e.g., 10 minutes from now)
            const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);
            this._logger.log(`Generated reset token for ${user.email}: ${resetToken}`);

            // 4. Update the user document
            const updateResult = await this._userService.updateOne(
                { _id: user._id },
                {
                    resetPasswordToken: resetToken,
                    resetPasswordExpires: tokenExpiry,
                }
            );
            this._logger.log(`Update result for ${user.email}: ${JSON.stringify(updateResult)}`);
            console.log("Update result for",user.email,updateResult)
            
            // 5. Create the reset URL and send the email
            const resetUrl = `${this._configService.get('FRONTEND_URL')}/reset-password/${resetToken}`;
    
            try {
                await this._mailService.sendPasswordResetEmail(user.email, { 
                    username: user.username, 
                    resetUrl });
                //     {
                //     to: user.email,
                //     subject: 'Groovia - Reset Your Password',
                //     template: './reset-password', // Points to reset-password.hbs
                //     context: {
                //         username: user.username,
                //         resetUrl: resetUrl,
                //     },
                // });
                return { success: true, message: 'Password reset link sent successfully.' };
            } catch (error) {
                this._logger.error(`Failed to send password reset email to ${user.email}`, error);
                // Even if email fails, don't reveal it to the client.
                // Log the error and return a generic success message.
                return { success: true, message: 'If an account with this email exists, a password reset link has been sent.' };
            }
        }

    async resetPassword(token: string, newPassword: string): Promise<boolean> {
        try {
            // console.log("resetting password in resetPassword in user-auth.service.ts",email,newPassword)
            // const user = await this._userService.findByEmail(email)

            // const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
            const user = await this._userService.findOne({
                resetPasswordToken: token,
                resetPasswordExpires:{$gt:new Date()}
            })
            if(!user){
                console.log("Invalid or expired password reset token received.")
                this._logger.warn('Invalid or expired password reset token received.');
                throw new HttpException('Invalid or expired password reset token.', HttpStatus.BAD_REQUEST);
            }

            const hashedPassword = await this._hashingService.hashPassword(newPassword)
            console.log("hashedPassword in resetPassword in user-auth.service.ts :",hashedPassword)

            const passwordUpdated = await this._userService.updatePassword(user._id,hashedPassword)
            console.log("passwordUpdated in resetPassword in user-auth.service.ts",passwordUpdated)
            const status = passwordUpdated ? true : false;
            if(!passwordUpdated){
                this._logger.error("Failed to update password")
                throw new HttpException('Password update failed.', HttpStatus.INTERNAL_SERVER_ERROR);
            }
            await this._userService.updateOne(
                { _id: user._id },
                {
                    $set: {
                        resetPasswordToken: undefined,
                        resetPasswordExpires: undefined,
                    }
                }
            );

            this._logger.log(`Password has been reset and token cleared for user: ${user.email}`);
            return true;
        } catch (error) {
            this._logger.error("Error resetting password",error.message)
            console.log("Error resetting password")
            throw error;
        }
    }
}

