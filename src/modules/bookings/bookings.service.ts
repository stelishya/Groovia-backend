import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IBookingsService } from './interfaces/bookings-service.interface';
import { IBookingsRepositoryToken, type IBookingsRepository } from './interfaces/bookings-repository.interface';
import { Booking } from './models/booking.schema';

@Injectable()
export class BookingsService implements IBookingsService {
    constructor(
        @Inject(IBookingsRepositoryToken) private readonly bookingsRepository: IBookingsRepository
    ) { }

    async create(createBookingDto: any): Promise<Booking> {
        return this.bookingsRepository.create(createBookingDto);
    }

    async findAll(): Promise<Booking[]> {
        return this.bookingsRepository.find({});
    }

    async findOne(id: string): Promise<Booking> {
        const booking = await this.bookingsRepository.findById(id);
        if (!booking) {
            throw new NotFoundException(`Booking with ID ${id} not found`);
        }
        return booking;
    }

    async update(id: string, updateBookingDto: any): Promise<Booking> {
        const updatedBooking = await this.bookingsRepository.findOneAndUpdate({ _id: id }, updateBookingDto);
        if (!updatedBooking) {
            throw new NotFoundException(`Booking with ID ${id} not found`);
        }
        return updatedBooking;
    }

    async remove(id: string): Promise<void> {
        await this.bookingsRepository.findOneAndDelete({ _id: id });
    }
}
