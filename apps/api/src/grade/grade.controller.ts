import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GradeService } from './grade.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('grade')
@UseGuards(JwtAuthGuard)
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  // Record a grade for a student
    @Post()
  async recordGrade(@Request() req: any, @Body() body: { termId: string; examId: string; studentId: string; marksObtained: number; remarks?: string }) {
    return this.gradeService.recordGrade(req.user.tenantId, body.termId, body.examId, body.studentId, body.marksObtained, body.remarks);
  }

  // Get all grades for a student
  @Get('student/:studentId')
  async getStudentGrades(
    @Request() req: any,
    @Param('studentId') studentId: string
  ) {
    return this.gradeService.getStudentGrades(req.user.tenantId, studentId);
  }

  // Update a grade
  @Put(':id')
  async updateGrade(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { marksObtained: number; remarks?: string }
  ) {
    return this.gradeService.updateGrade(
      req.user.tenantId,
      id,
      body.marksObtained,
      body.remarks
    );
  }
}