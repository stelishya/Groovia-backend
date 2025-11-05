import { Model, FilterQuery, ProjectionType, Types, UpdateQuery, Document as MongooseDocument } from 'mongoose';
import { IBaseRepository } from '../interfaces/base-repository.interface';

export class BaseRepository<T, D extends MongooseDocument & T> implements IBaseRepository<T, D> {
  constructor(protected readonly model: Model<D>) {}

  findById(
    id: string | Types.ObjectId,
    projection?: ProjectionType<T>,
  ): Promise<D | null> {
    return this.model.findById(id, projection).exec();
  }

  findOneAndUpdate(
    filter: FilterQuery<D>,
    update: UpdateQuery<D>,
  ): Promise<D | null> {
    return this.model.findOneAndUpdate(filter , update, { new: true }).exec() ;
  }
}