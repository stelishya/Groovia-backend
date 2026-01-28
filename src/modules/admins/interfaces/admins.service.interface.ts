import { User } from 'src/modules/users/models/user.schema';
import { GetAllUsersQueryDto } from '../dto/admin.dto';
import { Admin } from '../models/admins.schema';
import { PaymentDocument } from 'src/modules/payments/models/payment.schema';
import { Types } from 'mongoose';
import { SuccessResponseDto } from 'src/modules/users/dto/user.dto';
import { DashboardStats, PaymentResponse } from '../dto/admin.dto';
export const IAdminServiceToken = Symbol('IAdminService');

export interface IAdminService {
  findOne(filter: Partial<Admin>): Promise<Admin | null>;
  createAdmin(adminData: Partial<Admin>): Promise<Admin>;
  getDashboard(): Promise<DashboardStats>;
  getAllUsers(
    query: GetAllUsersQueryDto,
  ): Promise<{ users: User[]; total: number }>;
  blockUser(userId: string): Promise<SuccessResponseDto>;
  getUserGrowth(
    startDate?: string,
    endDate?: string,
    interval?: string,
  ): Promise<{ label: string; value: number }[]>;
  getRevenueTrend(
    startDate?: string,
    endDate?: string,
    interval?: string,
  ): Promise<{ label: string; value: number }[]>;
  getPayments(query: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ payments: PaymentResponse[]; total: number }>;
}
