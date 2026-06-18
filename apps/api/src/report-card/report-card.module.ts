import { Module } from '@nestjs/common';
import { ReportCardService } from './report-card.service';
import { ReportCardController } from './report-card.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportCardController],
  providers: [ReportCardService],
  exports: [ReportCardService],
})
export class ReportCardModule {}