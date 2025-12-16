import { User } from "src/modules/users/models/user.schema";
import { GetAllUsersQueryDto } from "../dto/admin.dto";
import { Admin } from "../models/admins.schema";
import { Types } from "mongoose";
import { SuccessResponseDto } from "src/modules/users/dto/user.dto";

export const IAdminServiceToken = Symbol('IAdminService')

export interface IAdminService {
    findOne(filter: Partial<Admin>): Promise<Admin | null>;
    createAdmin(adminData: any): Promise<Admin>;
    // getDashboard(): Promise<void>;
    getAllUsers(query: GetAllUsersQueryDto): Promise<{ users: User[]; total: number }>;
    blockUser(userId: string): Promise<SuccessResponseDto>
}