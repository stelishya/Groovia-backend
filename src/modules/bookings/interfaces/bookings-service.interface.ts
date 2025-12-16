import { Booking } from "../models/booking.schema";

export const IBookingsServiceToken = Symbol('IBookingsService');

export interface IBookingsService {
    create(createBookingDto: any): Promise<Booking>;
    findAll(): Promise<Booking[]>;
    findOne(id: string): Promise<Booking>;
    update(id: string, updateBookingDto: any): Promise<Booking>;
    remove(id: string): Promise<void>;
}
