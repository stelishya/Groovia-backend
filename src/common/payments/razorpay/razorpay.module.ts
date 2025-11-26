import { Module } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [RazorpayService],
  exports: [RazorpayService]
})
export class RazorpayModule { }
