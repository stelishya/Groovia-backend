import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingsRepository } from './repositories/bookings.repo';
import { Booking, BookingSchema } from './models/booking.schema';
import { IBookingsServiceToken } from './interfaces/bookings-service.interface';
import { IBookingsRepositoryToken } from './interfaces/bookings-repository.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
  ],
  controllers: [BookingsController],
  providers: [
    {
      provide: IBookingsServiceToken,
      useClass: BookingsService,
    },
    {
      provide: IBookingsRepositoryToken,
      useClass: BookingsRepository,
    },
  ],
  exports: [IBookingsServiceToken, IBookingsRepositoryToken],
})
export class BookingsModule {}
