import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './models/payment.schema';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentsRepository } from './repositories/payments.repository';
import { IPaymentsServiceToken } from './interfaces/payments.service.interface';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    ],
    providers: [
        PaymentsRepository,
        {
            provide: IPaymentsServiceToken,
            useClass: PaymentsService,
        },
    ],
    controllers: [PaymentsController],
    exports: [IPaymentsServiceToken],
})
export class PaymentsModule { }
