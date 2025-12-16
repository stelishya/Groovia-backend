import { Controller, Get, Post, Body, Patch, Param, Delete, Inject } from '@nestjs/common';
import {IBookingsServiceToken, type IBookingsService } from './interfaces/bookings-service.interface';

@Controller('bookings')
export class BookingsController {
    constructor(
        @Inject(IBookingsServiceToken) private readonly bookingsService: IBookingsService
    ) { }

    @Post()
    create(@Body() createBookingDto: any) {
        return this.bookingsService.create(createBookingDto);
    }

    @Get()
    findAll() {
        return this.bookingsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.bookingsService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateBookingDto: any) {
        return this.bookingsService.update(id, updateBookingDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.bookingsService.remove(id);
    }
}
