// apps/api/src/exam/exam.module.ts

import { Module } from '@nestjs/common';

// 1. Import your existing files
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';

// 2. Import the NEW bulk upload files we just created
import { BulkUploadService } from './bulk-upload.service';
import { BulkUploadController } from './bulk-upload.controller';

// 3. Import the modules this feature depends on
import { PrismaModule } from '../prisma/prisma.module';
import { AiGradingModule } from '../services/ai-grading.module';

@Module({
  // List all the modules we need
  imports: [PrismaModule, AiGradingModule],
  
  // List all the Controllers (the files that handle web requests)
  controllers: [ExamController, BulkUploadController], 
  
  // List all the Services (the files that handle the business logic)
  providers: [ExamService, BulkUploadService],
  
  // Export ExamService so other parts of the app can use it if needed
  exports: [ExamService],
})
export class ExamModule {}