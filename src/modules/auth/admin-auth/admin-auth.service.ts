import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { Admin } from 'src/modules/admins/models/admins.schema';
import { type IAdminAuthService, IAdminAuthServiceToken } from './interfaces/admin-auth.service.interface';
import { type IHashingService, IHashingServiceToken } from 'src/common/hashing/interfaces/hashing.service.interface';
import { type ICommonService, ICommonServiceToken } from '../common/interfaces/common-service.interface';
import { AdminLoginResponseDto } from './dto/admin-auth.dto';
import { Role } from 'src/common/enums/role.enum';
import { type IAdminService, IAdminServiceToken } from 'src/modules/admins/interfaces/admins.service.interface';

@Injectable()
export class AdminAuthService implements IAdminAuthService {
    private readonly _logger = new Logger(AdminAuthService.name)
    constructor(
        @Inject(IAdminServiceToken)
        private readonly _adminService: IAdminService,
        @Inject(IHashingServiceToken)
        private readonly _hashingService: IHashingService,
        @Inject(ICommonServiceToken)
        private readonly _commonService: ICommonService,
    ) { }
    async checkPassword(
        password: string,
        hashPassword: string,
    ): Promise<boolean> {
        return await this._hashingService.comparePassword(password, hashPassword)
    }
    async login(
        email: string,
        password: string,
        res: Response,
    ): Promise<AdminLoginResponseDto> {
        try {
            const admin = await this._adminService.findOne({ email })
            if (!admin) {
                throw new UnauthorizedException('Admin not found')
            }
            const isPasswordValid = await this.checkPassword(
                password,
                admin.password
            )
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid password')
            }
            const { accessToken, refreshToken } = await this._commonService.generateToken(
                admin,
                [Role.ADMIN],
            )
            this._commonService.setRefreshTokenCookie(res, refreshToken)

            return { admin, accessToken }
        } catch (error) {
            this._logger.error(`Login failed for admin ${email}: ${error.message}`)
            throw error
        }
    }
    async register(registerData: {
        username: string;
        password: string;
    }): Promise<Admin> {
        return this._adminService.createAdmin(registerData)
    }
    async logout(res: Response): Promise<{ message: string }> {
        try {
            // Clear the refresh token cookie
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            });
            this._logger.log('Admin logged out successfully');
            return { message: 'Logged out successfully' };
        } catch (error) {
            this._logger.error(`Logout failed: ${error.message}`);
            throw error;
        }
    }
}
