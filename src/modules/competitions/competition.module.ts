import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompetitionController } from './controller/competition.controller';
import { CompetitionService } from './services/competition.service';
import { CompetitionRepository } from './repositories/competition.repository';
import { Competition, CompetitionSchema } from './models/competition.schema';
import { RazorpayModule } from 'src/common/payments/razorpay/razorpay.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Competition.name, schema: CompetitionSchema },
    ]),
    RazorpayModule,
  ],
  controllers: [CompetitionController],
  providers: [CompetitionService, CompetitionRepository],
  exports: [CompetitionService, CompetitionRepository],
})
export class CompetitionModule {}
