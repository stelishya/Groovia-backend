import { FilterQuery } from "mongoose";
import { Admin } from "../models/admins.schema";

export const IAdminRepoToken = Symbol('IAdminRepo')

export interface IAdminRepo{
    findOne(filter:FilterQuery<Admin>):Promise<Admin | null>;
    create(input:Partial<Admin>):Promise<Admin>;
}