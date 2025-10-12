import { Injectable } from "@nestjs/common";
import { Admin, AdminDocument } from "../models/admins.schema";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model } from "mongoose";

@Injectable()
export class AdminRepository {
    constructor(
        @InjectModel(Admin.name) 
        private readonly _adminModel: Model<AdminDocument>,
    ) {}

    async findOne(filter: FilterQuery<Admin>): Promise<Admin | null> {
        return this._adminModel.findOne(filter).exec();
    }

    async create(input: Partial<Admin>): Promise<Admin> {
        return this._adminModel.create(input);
    }
}