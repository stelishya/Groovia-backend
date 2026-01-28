import {
  FilterQuery,
  ProjectionType,
  Types,
  UpdateQuery,
  Document as MongooseDocument,
} from 'mongoose';

export const IBaseRepositoryToken = Symbol('IBaseRepository');

export interface IBaseRepository<T, D extends MongooseDocument & T> {
  findById(
    id: string | Types.ObjectId,
    projection?: ProjectionType<T>,
  ): Promise<D | null>;
  findOneAndUpdate(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
  ): Promise<D | null>;
}
