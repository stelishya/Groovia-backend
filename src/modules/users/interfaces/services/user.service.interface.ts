import { FilterQuery, QueryOptions, Types, UpdateQuery } from "mongoose";
import { User, UserDocument } from "../../models/user.schema";
import { GetAllUsersQueryDto } from "src/modules/admins/dto/admin.dto";

export const IUserServiceToken = Symbol('IUserService');

export interface IUserService {
    findOne(filter: FilterQuery<User>): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    createUser(user: Partial<User>): Promise<User>
    updateOne(filter: FilterQuery<User>, update: UpdateQuery<User>): Promise<User | null>;
    updatePassword(userId: Types.ObjectId, newPassword: string): Promise<boolean>;
    findById(id: string | Types.ObjectId): Promise<UserDocument | null>;

    getAllUsersForAdmin(
        query: GetAllUsersQueryDto,
    ): Promise<{ users: User[], total: number }>
    blockUser(userId: Types.ObjectId): Promise<User | null>

    find(filter: FilterQuery<User>, options?: QueryOptions): Promise<User[]>;
    count(filter: FilterQuery<User>): Promise<number>;

    //Methods for Google Authentication used by CommonService
    findByEmail(email: string): Promise<User | null>;
    createGoogleUser(userDto: Partial<User>): Promise<User>
    updateUserGoogleId(userId: Types.ObjectId, googleId: string): Promise<User | null>

    findDancersWithFilters(
        filter: FilterQuery<User>,
        skip: number,
        limit: number,
        sort: any
    ): Promise<User[]>;
}