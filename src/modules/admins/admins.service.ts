import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IAdminService } from './interfaces/admins.service.interface';
import { IAdminRepoToken } from './interfaces/admins.repo.interface';
import type { IAdminRepo } from './interfaces/admins.repo.interface';
import { Admin } from './models/admins.schema';
import { User } from '../users/models/user.schema';
import { GetAllUsersQueryDto } from './dto/admin.dto';
import { type IUserService, IUserServiceToken } from '../users/interfaces/services/user.service.interface';
import { Types } from 'mongoose';
import { SuccessResponseDto } from '../users/dto/user.dto';
import { HttpStatus } from 'src/common/enums/http-status.enum';


@Injectable()
export class AdminsService implements IAdminService {
    private readonly _logger = new Logger(AdminsService.name)

    constructor(
        @Inject(IAdminRepoToken)
        private readonly _adminRepo: IAdminRepo,
                // @Inject('AdminRepository') private readonly adminRepo: IAdminRepo,
        @Inject(IUserServiceToken)
        private readonly _userService: IUserService,
    ) { }

    async findOne(filter: Partial<Admin>): Promise<Admin | null> {
        try {
            this._logger.log('Delegating to AdminRepo to find admin');
            return this._adminRepo.findOne(filter);
        } catch (error) {
            throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
        }
    }

    async createAdmin(adminData: any): Promise<Admin> {
        adminData.password = await bcrypt.hash(adminData.password, 10);
        return this._adminRepo.create(adminData);
    }

    async getAllUsers(
        query: GetAllUsersQueryDto,
    ): Promise<{ users: User[]; total: number }> {
        try {
            this._logger.log('Delegating to UsersService to fetch users');
            return await this._userService.getAllUsersForAdmin(query);
        } catch (error) {
            console.error('Error fetching users:', error);
            throw new HttpException('No users found', HttpStatus.NOT_FOUND);
        }
    }

    async blockUser(userId: string): Promise<SuccessResponseDto> {
        try {
            const userObjectId = new Types.ObjectId(userId); // Convert in service
            const updatedUser = await this._userService.blockUser(userObjectId);
            return {
                success: true,
                message: updatedUser?.isBlocked ? "User blocked successfully" : "User unblocked successfully",
            }
        } catch (error) {
            this._logger.error(`Error toggle blocking user: ${error}`);
            throw new HttpException("Failed to toggle block user", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getDashboard(): Promise<any> {
        try {
            return await this._adminRepo.getDashboardAggregates();
        } catch (error) {
            this._logger.error('Error building dashboard: ' + error);
            throw new HttpException('Failed to fetch dashboard', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getUserGrowth(startDate?: string, endDate?: string, interval = 'daily') {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const dateFormat = interval === 'monthly' ? '%Y-%m' : '%Y-%m-%d';

        const pipeline = [
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ];

        return await this._adminRepo.getUserGrowth(startDate, endDate, interval);
    }

    async getRevenueTrend(startDate?: string, endDate?: string, interval = 'daily') {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const dateFormat = interval === 'monthly' ? '%Y-%m' : '%Y-%m-%d';

        const pipeline = [
            { $match: { status: 'success', createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ];

        return await this._adminRepo.getRevenueTrend(startDate, endDate, interval);
    }
    async getPayments(query: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        status?: string;
        type?: string;
        dateFrom?: string;
        dateTo?: string;
    }) {
        return this._adminRepo.getPayments(query);
    }
}
