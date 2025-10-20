import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type{ IUserService } from '../interfaces/services/user.service.interface';
import { User } from '../models/user.schema';
import { FilterQuery, Model, ObjectId, Types, UpdateQuery ,Document as MongooseDocument,} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { type IUserRepository, IUserRepositoryToken } from '../interfaces/user.repo.interface';
import { GetAllUsersQueryDto } from '../../admins/dto/admin.dto';
import { type IBaseRepository, IBaseRepositoryToken } from 'src/common/interfaces/base-repository.interface';

@Injectable()
export class UsersService implements IUserService{
    constructor(
        @Inject(IUserRepositoryToken) 
        private readonly _userRepository: IUserRepository,
        @Inject(IBaseRepositoryToken)
        private readonly _baseRepository: IBaseRepository<User,User & MongooseDocument>
    ) {}

    findOne(filter: FilterQuery<User>): Promise<User | null> {
        return this._userRepository.findOne(filter);
    }
    findByUsername(username: string): Promise<User | null> {
        return this._userRepository.findOne({ username });
    }
    createUser(user: Partial<User>): Promise<User> {
        return this._userRepository.create(user);
        // return newUser.save();
    }
    findByEmail(email: string): Promise<User | null> {
        return this._userRepository.findOne({ email });
    }
    
    updateOne(filter: FilterQuery<User>, update: UpdateQuery<User>): Promise<User | null> {
        console.log('Updating user with filter:', JSON.stringify(filter));
        console.log('Update data:', JSON.stringify(update));
        return this._userRepository.updateOne(filter, update);
        // return this._userRepository.findOneAndUpdate(filter, update, { new: true }).exec();
    }
    
    updatePassword(userId: Types.ObjectId, newPassword: string):Promise<boolean>{
        return this._userRepository.updatePassword(userId,newPassword);

        // const result = await this._userRepository.updateOne(
        //     { _id: userId },
        //     { $set: { password: newPassword } }
        // ).exec();
        // return result.modifiedCount > 0;
    }
    async getAllUsersForAdmin(
        query: GetAllUsersQueryDto
    ): Promise<{ users: User[]; total: number; }> {
        const {
            page='1',
            limit='10',
            search,
            role,
        } = query;
        const filter : FilterQuery<User> = {};
        if(search){
            filter.$or= [
                {username:{$regex:search,$options:'i'}},
                {email:{$regex:search,$options:'i'}}
            ]
        }
        const total = await this._userRepository.countDocuments(filter);
        const users = await this._userRepository.getAllUsersForAdmin(
            filter,
            (parseInt(page)-1)* parseInt(limit),
            parseInt(limit),
            {password:0}
        )
        return {users,total}
    }

    async blockUser(userId: Types.ObjectId): Promise<User | null> {
        // const user = await this._baseRepository.findById(userId);
        const user = await this._userRepository.findOne({ _id: userId });
        if(!user){
            throw new NotFoundException("User not found")
        }
        // return this._baseRepository.findOneAndUpdate(
           return this._userRepository.updateOne(
            {_id:userId},
            {isBlocked:!user.isBlocked}
        )
    }
}
