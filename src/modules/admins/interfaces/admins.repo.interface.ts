import { FilterQuery } from "mongoose";
import { Admin } from "../models/admins.schema";

export const IAdminRepoToken = Symbol('IAdminRepo')

export interface IAdminRepo{
    findOne(filter:FilterQuery<Admin>):Promise<Admin | null>;
    create(input:Partial<Admin>):Promise<Admin>;
    getDashboardAggregates(): Promise<any>;
    getUserGrowth(startDate?: string, endDate?: string, interval?: string): Promise<{ label: string; value: number }[]>;
    getRevenueTrend(startDate?: string, endDate?: string, interval?: string): Promise<{ label: string; value: number }[]>;
    getPayments(query: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        status?: string;
        type?: string;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<{ payments: any[]; total: number }>;
}