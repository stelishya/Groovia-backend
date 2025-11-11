import { FilterQuery, UpdateQuery } from "mongoose";
import { Otp } from "../../../../common/otp/models/otp.schema";

export const IOtpRepositoryToken = Symbol('IOtpRepository');

export interface IOtpRepository {
    upsert(filter:FilterQuery<Otp>, data:Partial<Otp>): Promise<Boolean>;
    findOneAndUpdate(filter:FilterQuery<Otp>, update:UpdateQuery<Otp>): Promise<boolean>;
}