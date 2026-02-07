import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import { Events, EventDocument } from '../models/events.schema';
import { IClientRepository } from '../interfaces/client-repository.interface';

@Injectable()
export class ClientRepository implements IClientRepository {
    constructor(
        @InjectModel(Events.name)
        private readonly _eventModel: Model<Events>,
    ) { }

    async findById(id: string): Promise<EventDocument | null> {
        return this._eventModel.findById(id);
    }

    async findByIdPopulated(id: string): Promise<EventDocument | null> {
        return this._eventModel
            .findById(id)
            .populate('dancerId')
            .populate('clientId');
    }

    async findByIdLeanPopulated(
        id: string,
        populate: any[],
    ): Promise<any | null> {
        return this._eventModel.findById(id).populate(populate).lean().exec();
    }

    async find(filter: FilterQuery<Events>): Promise<EventDocument[]> {
        return this._eventModel.find(filter);
    }

    async findOne(filter: FilterQuery<Events>): Promise<EventDocument | null> {
        return this._eventModel.findOne(filter);
    }

    async create(data: Partial<Events>): Promise<EventDocument> {
        return this._eventModel.create(data);
    }

    async findOneAndUpdate(
        filter: FilterQuery<Events>,
        update: UpdateQuery<Events>,
        options: { new?: boolean; lean?: boolean } = { new: true },
    ): Promise<any | null> {
        return this._eventModel.findOneAndUpdate(filter, update, options).exec();
    }

    async countDocuments(filter: FilterQuery<Events>): Promise<number> {
        return this._eventModel.countDocuments(filter);
    }

    async findWithPagination(
        filter: FilterQuery<Events>,
        sort: any,
        skip: number,
        limit: number,
    ): Promise<EventDocument[]> {
        return this._eventModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('dancerId', 'username profileImage danceStyles');
    }

    async findWithPaginationPopulated(
        filter: FilterQuery<Events>,
        sort: any,
        skip: number,
        limit: number,
        populate: any[],
    ): Promise<EventDocument[]> {
        return this._eventModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate);
    }
}