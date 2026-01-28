import { Module } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { ConfigModule } from '@nestjs/config';
import { IPaymentServiceToken } from '../interfaces/payment.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: IPaymentServiceToken,
      useClass: RazorpayService,
    },
  ],
  exports: [IPaymentServiceToken],
})
export class RazorpayModule {}
