import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  FilterQuery,
  Model,
  PipelineStage,
  QueryOptions,
  SortOrder,
  Types,
  UpdateQuery,
} from 'mongoose';
import { User, UserDocument } from '../models/user.schema';
import { IUserRepository } from '../interfaces/user.repo.interface';
import { skip } from 'node:test';
import { ProjectionType } from 'mongoose';
import { BaseRepository } from 'src/common/repositories/base.repo';

@Injectable()
export class UserRepository
  extends BaseRepository<User, UserDocument>
  implements IUserRepository
{
  constructor(
    @InjectModel(User.name) private readonly _userModel: Model<UserDocument>,
  ) {
    super(_userModel);
  }

  async create(user: Partial<User>): Promise<User> {
    const newUser = new this._userModel(user);
    // const user =  this._userModel.findByEmail({email})
    // const exist = this._userModel.findOne(user:user,role)
    // if(exist){

    // }
    return newUser.save();
  }

  async findOne(filter: FilterQuery<User>): Promise<User | null> {
    return this._userModel.findOne(filter).exec();
  }

  async updateOne(
    filter: FilterQuery<User>,
    update: UpdateQuery<User>,
  ): Promise<User | null> {
    return this._userModel
      .findOneAndUpdate(filter, update, { new: true })
      .exec();
  }

  async updatePassword(
    userId: Types.ObjectId,
    newPasswordHash: string,
  ): Promise<boolean> {
    const result = await this._userModel
      .updateOne({ _id: userId }, { $set: { password: newPasswordHash } })
      .exec();
    return result.modifiedCount > 0;
  }
  async getUsersForAdmin(
    filter: FilterQuery<User>,
    skip: number,
    limit: number,
    projection?: ProjectionType<User>,
  ): Promise<User[]> {
    return this._userModel
      .find(filter, projection)
      .skip(skip)
      .limit(limit)
      .exec();
  }
  getAllUsersForAdmin(
    filter: FilterQuery<User>,
    skip: number,
    limit: number,
    sort: string | { [key: string]: SortOrder },
  ): Promise<User[]> {
    return this._userModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }
  countDocuments(filter?: FilterQuery<User>): Promise<number> {
    return this._userModel.countDocuments(filter).exec();
  }

  find(filter: FilterQuery<User>, options?: QueryOptions): Promise<User[]> {
    let query = this._userModel.find(filter);
    if (options?.sort) {
      query = query.sort(options.sort);
    }
    if (options?.skip) {
      query = query.skip(options.skip);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    return query.exec();
  }
  findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this._userModel.findById(id).exec();
  }

  async findDancersWithFilters(
    filter: FilterQuery<User>,
    skip: number,
    limit: number,
    sort: Record<string, 1 | -1>,
  ): Promise<User[]> {
    const pipeline: PipelineStage[] = [
      { $match: filter },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ['$likes', []] } },
        },
      },
    ];

    if (sort) {
      // Map 'likes' sort to 'likesCount'
      const sortStage: Record<string, 1 | -1> = {};
      // Check if we are sorting by 'likes'
      if (sort.likes) {
        sortStage.likesCount = sort.likes;
        delete sort.likes; // Remove original likes sort if present combined
      }
      // Merge with other sort keys
      Object.assign(sortStage, sort);

      if (Object.keys(sortStage).length > 0) {
        pipeline.push({ $sort: sortStage });
      }
    }

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    return this._userModel.aggregate(pipeline).exec();
  }
}
