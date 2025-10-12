import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';
import { User } from '../models/user.schema';
import { IUserRepository } from '../interfaces/user.repo.interface';

@Injectable()
export class UserRepository implements IUserRepository {
    constructor(@InjectModel(User.name) private readonly _userModel: Model<User>) { }

    async create(user: Partial<User>): Promise<User> {
        const newUser = new this._userModel(user);
        return newUser.save();
    }

    async findOne(filter: FilterQuery<User>): Promise<User | null> {
        return this._userModel.findOne(filter).exec();
    }

    async updateOne(filter: FilterQuery<User>, update: UpdateQuery<User>): Promise<User | null> {
        return this._userModel.findOneAndUpdate(filter, update, { new: true }).exec();
    }

    async updatePassword(userId: Types.ObjectId, newPasswordHash: string): Promise<boolean> {
        const result = await this._userModel.updateOne(
            { _id: userId },
            { $set: { password: newPasswordHash } }
        ).exec();
        return result.modifiedCount > 0;
    }
}