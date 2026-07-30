// apps/api/src/exam/bulk-upload.controller.ts

import {
  Controller,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Adjust path if needed
import { BulkUploadService } from './bulk-upload.service';

@Controller('exams')
@UseGuards(JwtAuthGuard)
export class BulkUploadController {
  constructor(private bulkUploadService: BulkUploadService) {}

  @Post(':examId/questions/bulk-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
      fileFilter: (req, file, cb) => {
        const allowed = ['.xlsx', '.xls', '.csv', '.docx', '.doc'];
        const fileName = file.originalname.toLowerCase();
        if (allowed.some((ext) => fileName.endsWith(ext))) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only .xlsx, .xls, .csv, and .docx files are allowed'), false);
        }
      },
    }),
  )
  async bulkUpload(
    @Request() req: any,
    @Param('examId') examId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const tenantId = req.user.tenantId;
    const questions = await this.bulkUploadService.parseFile(file);
    const saved = await this.bulkUploadService.saveQuestions(tenantId, examId, questions);

    return {
      success: true,
      message: `Successfully uploaded ${saved.length} questions`,
      count: saved.length,
      data: saved,
    };
  }
}