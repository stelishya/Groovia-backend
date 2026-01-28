import { FilterQuery, UpdateQuery } from 'mongoose';
import {
  UpgradeRequest,
  UpgradeRequestDocument,
} from '../models/upgrade-request.schema';
import { IBaseRepository } from 'src/common/interfaces/base-repository.interface';

export const IUpgradeRequestRepoToken = Symbol('IUpgradeRequestRepo');

export interface IUpgradeRequestRepo
  extends IBaseRepository<UpgradeRequest, UpgradeRequestDocument> {
  create(data: Partial<UpgradeRequest>): Promise<UpgradeRequestDocument>;
  findOne(
    filter: FilterQuery<UpgradeRequest>,
  ): Promise<UpgradeRequestDocument | null>;
  find(filter: FilterQuery<UpgradeRequest>): Promise<UpgradeRequestDocument[]>;
  update(
    id: string,
    updateData: UpdateQuery<UpgradeRequest>,
  ): Promise<UpgradeRequestDocument | null>;
  findById(id: string): Promise<UpgradeRequestDocument | null>;
}
