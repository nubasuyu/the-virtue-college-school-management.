// apps/api/src/services/ai-grading.module.ts

import { Module } from '@nestjs/common';
import { AiGradingService } from './ai-grading.service';
import { PrismaModule } from '../prisma/prisma.module'; // Adjust path to your actual PrismaModule

@Module({
  imports: [PrismaModule],
  providers: [AiGradingService],
  exports: [AiGradingService], // This allows ExamModule to use it
})
export class AiGradingModule {}