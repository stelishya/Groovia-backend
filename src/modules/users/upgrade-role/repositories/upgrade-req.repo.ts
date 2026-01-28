import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, UpdateQuery } from 'mongoose';
import { BaseRepository } from 'src/common/repositories/base.repo';
import {
  UpgradeRequest,
  UpgradeRequestDocument,
} from '../models/upgrade-request.schema';
import { IUpgradeRequestRepo } from '../interface/upgrade-request.repo.interface';
import { Document } from 'mongoose';

@Injectable()
export class UpgradeRequestRepository
  extends BaseRepository<UpgradeRequest, UpgradeRequestDocument>
  implements IUpgradeRequestRepo
{
  constructor(
    @InjectModel(UpgradeRequest.name)
    private upgradeRequestModel: Model<UpgradeRequestDocument>,
  ) {
    super(upgradeRequestModel);
  }

  async create(data: Partial<UpgradeRequest>): Promise<UpgradeRequestDocument> {
    const doc = new this.upgradeRequestModel(data);
    return doc.save();
  }

  async findOne(
    filter: FilterQuery<UpgradeRequest>,
  ): Promise<UpgradeRequestDocument | null> {
    return this.upgradeRequestModel.findOne(filter).exec();
  }

  async find(
    filter: FilterQuery<UpgradeRequest>,
  ): Promise<UpgradeRequestDocument[]> {
    return this.upgradeRequestModel.find(filter).exec();
  }

  async update(
    id: string,
    updateData: UpdateQuery<UpgradeRequest>,
  ): Promise<UpgradeRequestDocument | null> {
    return this.upgradeRequestModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }
}
