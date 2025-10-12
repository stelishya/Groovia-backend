import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { IOtpRepository } from '../../user-auth/interfaces/otp.repo.interface';
import { Otp, OtpDocument } from '../models/otp.schema';


@Injectable()
export class OtpRepository implements IOtpRepository {
  constructor(
    @InjectModel(Otp.name) private readonly _otpModel: Model<OtpDocument>,
  ) {}

  async upsert(filter: FilterQuery<Otp>, data: Partial<Otp>): Promise<boolean> {
    const result = await this._otpModel.updateOne(
      filter,
      { $set: data },
      { upsert: true },
    );
    return result.acknowledged;
  }

  async findOneAndUpdate(
    filter: FilterQuery<Otp>,
    update: UpdateQuery<Otp>,
  ): Promise<boolean> {
    const result = await this._otpModel.updateOne(filter, update);
    return result.modifiedCount > 0;
  }
}