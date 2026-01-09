import { FilterQuery, ProjectionType, QueryOptions, Types, UpdateQuery } from 'mongoose';
import { User, UserDocument } from '../models/user.schema';

export const IUserRepositoryToken = Symbol('IUserRepository');

export interface IUserRepository {
    create(user: Partial<User>): Promise<User>;
    findOne(filter: FilterQuery<User>): Promise<User | null>;
    updateOne(filter: FilterQuery<User>, update: UpdateQuery<User>): Promise<User | null>;
    updatePassword(userId: Types.ObjectId, newPasswordHash: string): Promise<boolean>;

    getAllUsersForAdmin(
        filter: FilterQuery<User>,
        skip: number,
        limit: number,
        sort: any,
        projection?: ProjectionType<User>,
    ): Promise<User[]>;
    countDocuments(filter?: FilterQuery<User>): Promise<number>;
    getUsersForAdmin(
        filter: FilterQuery<User>,
        skip: number,
        limit: number,
        projection?: ProjectionType<User>,
    ): Promise<User[]>

    find(filter: FilterQuery<User>, options?: QueryOptions): Promise<User[]>;
    countDocuments(filter?: FilterQuery<User>): Promise<number>;

    findById(id: string | Types.ObjectId): Promise<UserDocument | null>;

    findDancersWithFilters(
        filter: FilterQuery<User>,
        skip: number,
        limit: number,
        sort: any
    ): Promise<User[]>;
}