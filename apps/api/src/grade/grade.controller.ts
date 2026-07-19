import { Controller, Get, Post, Body, Query, Param, Req, UseGuards } from '@nestjs/common';
import { GradeService } from './grade.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('grade')
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @Get('exam/:examId')
  getGradesForExam(@Req() req: any, @Param('examId') examId: string) {
    return this.gradeService.getGradesForExam(req.user.tenantId, examId);
  }

  @Post()
  saveGrade(@Req() req: any, @Body() body: any) {
    return this.gradeService.saveGrade(req.user.tenantId, body);
  }

  @Get('exams/class/:classId')
  getExamsForClass(@Req() req: any, @Param('classId') classId: string) {
    return this.gradeService.getExamsForClass(req.user.tenantId, classId);
  }
}