import { FilterQuery, UpdateQuery } from 'mongoose';
import { IBaseRepository } from '../../../common/interfaces/base-repository.interface';
import { Booking, BookingDocument } from '../models/booking.schema';
import { CreateBookingDto } from '../dto/booking.dto';

export const IBookingsRepositoryToken = Symbol('IBookingsRepository');

export interface IBookingsRepository
  extends IBaseRepository<Booking, BookingDocument> {
  // Add specific methods here if needed
  create(createBookingDto: CreateBookingDto): Promise<Booking>;
  find(options?: FilterQuery<Booking>): Promise<Booking[]>;
  findOneAndDelete(filter: FilterQuery<Booking>): Promise<Booking | null>;
}
