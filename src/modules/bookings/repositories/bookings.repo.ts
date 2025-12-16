import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repo';
import { Booking, BookingDocument } from '../models/booking.schema';
import { IBookingsRepository } from '../interfaces/bookings-repository.interface';

@Injectable()
export class BookingsRepository extends BaseRepository<Booking, BookingDocument> implements IBookingsRepository {
    constructor(
        @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>
    ) {
        super(bookingModel);
    }
    async create(data: Partial<Booking>): Promise<Booking> {
        const booking = new this.bookingModel(data);
        return booking.save();
    }
    async find(options?: FilterQuery<Booking>): Promise<Booking[]> {
        return this.bookingModel.find((options || {}) as FilterQuery<BookingDocument>).exec();
    }
    async findOneAndDelete(filter: FilterQuery<Booking>): Promise<Booking | null> {
        return this.bookingModel.findOneAndDelete(filter as FilterQuery<BookingDocument>).exec();
    }
}
