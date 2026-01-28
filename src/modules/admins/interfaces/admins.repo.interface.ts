import { FilterQuery } from 'mongoose';
import { Admin } from '../models/admins.schema';
import {
  Payment,
  PaymentDocument,
} from 'src/modules/payments/models/payment.schema';
import { DashboardStats, PaymentResponse } from '../dto/admin.dto';

export const IAdminRepoToken = Symbol('IAdminRepo');

export interface IAdminRepo {
  findOne(filter: FilterQuery<Admin>): Promise<Admin | null>;
  create(input: Partial<Admin>): Promise<Admin>;
  getDashboardAggregates(): Promise<DashboardStats>;
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
