import { FilterQuery, UpdateQuery } from 'mongoose';
import { Events, EventDocument } from '../models/events.schema';

export const IClientRepositoryToken = Symbol('IClientRepository');

export interface IClientRepository {
    findById(id: string): Promise<EventDocument | null>;
    findByIdPopulated(id: string): Promise<EventDocument | null>;
    findByIdLeanPopulated(
        id: string,
        populate: any[],
    ): Promise<any | null>;
    find(filter: FilterQuery<Events>): Promise<EventDocument[]>;
    findOne(filter: FilterQuery<Events>): Promise<EventDocument | null>;
    create(data: Partial<Events>): Promise<EventDocument>;
    findOneAndUpdate(
        filter: FilterQuery<Events>,
        update: UpdateQuery<Events>,
        options?: { new?: boolean; lean?: boolean },
    ): Promise<any | null>;
    countDocuments(filter: FilterQuery<Events>): Promise<number>;
    findWithPagination(
        filter: FilterQuery<Events>,
        sort: any,
        skip: number,
        limit: number,
    ): Promise<EventDocument[]>;
    findWithPaginationPopulated(
        filter: FilterQuery<Events>,
        sort: any,
        skip: number,
        limit: number,
        populate: any[],
    ): Promise<EventDocument[]>;
}
