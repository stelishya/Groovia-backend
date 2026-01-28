import { Booking } from '../models/booking.schema';
import { CreateBookingDto, UpdateBookingDto } from '../dto/booking.dto';

export const IBookingsServiceToken = Symbol('IBookingsService');

export interface IBookingsService {
  create(createBookingDto: CreateBookingDto): Promise<Booking>;
  findAll(): Promise<Booking[]>;
  findOne(id: string): Promise<Booking>;
  update(id: string, updateBookingDto: UpdateBookingDto): Promise<Booking>;
  remove(id: string): Promise<void>;
}
