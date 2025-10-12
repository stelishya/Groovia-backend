import { FilterQuery, Types, UpdateQuery } from 'mongoose';
import { User } from '../models/user.schema';

export const IUserRepositoryToken = Symbol('IUserRepository');

export interface IUserRepository {
    create(user: Partial<User>): Promise<User>;
    findOne(filter: FilterQuery<User>): Promise<User | null>;
    updateOne(filter: FilterQuery<User>, update: UpdateQuery<User>): Promise<User | null>;
    updatePassword(userId: Types.ObjectId, newPasswordHash: string): Promise<boolean>;
}