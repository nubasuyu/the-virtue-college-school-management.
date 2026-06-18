import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExamService } from './exam.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('exam')
@UseGuards(JwtAuthGuard)
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  // Create a new exam
    @Post()
  async createExam(@Request() req: any, @Body() body: { termId: string; name: string; assessmentType: string; subjectId: string; classId: string; date: string; totalMarks: number }) {
    return this.examService.createExam(req.user.tenantId, body.termId, body.name, body.assessmentType, body.subjectId, body.classId, body.date, body.totalMarks);
  }

  // Get all exams for a class
  @Get('class/:classId')
  async getClassExams(
    @Request() req: any,
    @Param('classId') classId: string
  ) {
    return this.examService.getClassExams(req.user.tenantId, classId);
  }

  // Get a single exam with all grades
  @Get(':id')
  async getExamById(@Request() req: any, @Param('id') id: string) {
    return this.examService.getExamById(req.user.tenantId, id);
  }
}