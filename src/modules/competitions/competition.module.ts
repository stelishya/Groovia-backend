import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompetitionController } from './controller/competition.controller';
import { CompetitionService } from './services/competition.service';
import { CompetitionRepository } from './repositories/competition.repository';
import { Competition, CompetitionSchema } from './models/competition.schema';
import { RazorpayModule } from 'src/common/payments/razorpay/razorpay.module';
import { PaymentsModule } from '../payments/payments.module';
import { ICompetitionRepoToken } from './interfaces/competition.repo.interface';
import { ICompetitionServiceToken } from './interfaces/competition.service.interface';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Competition.name, schema: CompetitionSchema },
    ]),
    RazorpayModule,
    PaymentsModule,
  ],
  controllers: [CompetitionController],
  providers: [
    // CompetitionService, CompetitionRepository,
    {
      provide: ICompetitionServiceToken,
      useClass: CompetitionService
    },
    {
      provide: ICompetitionRepoToken,
      useClass: CompetitionRepository
    }],
  exports: [ICompetitionServiceToken, ICompetitionRepoToken],
})
export class CompetitionModule { }
