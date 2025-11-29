import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompetitionController } from './controller/competition.controller';
import { CompetitionService } from './services/competition.service';
import { CompetitionRepository } from './repositories/competition.repository';
import { Competition, CompetitionSchema } from './models/competition.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Competition.name, schema: CompetitionSchema },
    ]),
  ],
  controllers: [CompetitionController],
  providers: [CompetitionService, CompetitionRepository],
  exports: [CompetitionService, CompetitionRepository],
})
export class CompetitionModule {}
