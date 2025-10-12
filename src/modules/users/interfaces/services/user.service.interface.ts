import { FilterQuery, Types, UpdateQuery } from "mongoose";
import { User } from "../../models/user.schema";

export const IUserServiceToken =  Symbol('IUserService');

export interface IUserService{
    findOne(filter: FilterQuery<User>):Promise<User|null>;
    findByUsername(username:string):Promise<User|null>;
    createUser(user:Partial<User>):Promise<User>
    updateOne(filter:FilterQuery<User>,update:UpdateQuery<User>):Promise<User|null>;
    updatePassword(userId:Types.ObjectId,newPassword:string):Promise<boolean>;
    findByEmail(email:string):Promise<User|null>;
}