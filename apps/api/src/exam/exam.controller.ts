import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 
import { ExamService } from './exam.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ApproveGradeDto } from './dto/approve-grade.dto';

@Controller('exams')
@UseGuards(JwtAuthGuard) 
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  // ==========================================
  // EXAM CREATION (Admin/Teacher only)
  // ==========================================

  @Post()
  async createExam(@Request() req: any, @Body() createExamDto: CreateExamDto) {
    if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(req.user.role)) {
      throw new ForbiddenException('Only admins and teachers can create exams.');
    }
    return this.examService.createExam(req.user.tenantId, createExamDto);
  }

  @Post(':examId/questions')
  async addQuestion(
    @Request() req: any,
    @Param('examId') examId: string,
    @Body() createQuestionDto: CreateQuestionDto,
  ) {
    if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(req.user.role)) {
      throw new ForbiddenException('Only admins and teachers can add questions.');
    }
    return this.examService.addQuestion(req.user.tenantId, examId, createQuestionDto);
  }

  // ==========================================
  // FETCHING EXAMS
  // ==========================================

  @Get()
  async findAll(@Request() req: any) {
    // ✅ FIXED: Use req.user.userId instead of req.user.sub
    return this.examService.findAll(req.user.tenantId, req.user.role, req.user.userId);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.examService.findOne(req.user.tenantId, id, req.user.role, req.user.userId);
  }

  // ==========================================
  // STUDENT EXAM EXECUTION
  // ==========================================

  @Post(':examId/start')
  async startExam(@Request() req: any, @Param('examId') examId: string) {
    const tenantId = req.user.tenantId;
    
    // ✅ FIXED: Use req.user.userId
    const studentId = req.user.userId; 
    
    if (!studentId) {
      console.log('🔍 DEBUG - req.user contents:', JSON.stringify(req.user, null, 2));
      throw new ForbiddenException('User ID not found in token.');
    }
    
    return this.examService.startExamAttempt(tenantId, examId, studentId);
  }

  @Patch('attempts/:attemptId/answers/:questionId')
  async saveAnswer(
    @Request() req: any,
    @Param('attemptId') attemptId: string,
    @Param('questionId') questionId: string,
    @Body() submitAnswerDto: SubmitAnswerDto,
  ) {
    return this.examService.saveAnswer(req.user.tenantId, attemptId, questionId, submitAnswerDto);
  }

  @Post('attempts/:attemptId/submit')
  async submitExam(@Request() req: any, @Param('attemptId') attemptId: string) {
    const tenantId = req.user.tenantId;
    
    // ✅ FIXED: Use req.user.userId
    const studentId = req.user.userId; 
    
    if (!studentId) {
      throw new ForbiddenException('User ID not found in token.');
    }
    
    return this.examService.submitExam(tenantId, attemptId, studentId);
  }

  // ==========================================
  // TEACHER GRADING DASHBOARD
  // ==========================================

  @Get(':examId/grading/pending')
  async getPendingGrades(@Request() req: any, @Param('examId') examId: string) {
    if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(req.user.role)) {
      throw new ForbiddenException('Only teachers and admins can view pending grades.');
    }
    return this.examService.getPendingGrades(req.user.tenantId, examId);
  }

  @Put('grading/logs/:logId')
  async approveGrade(
    @Request() req: any,
    @Param('logId') logId: string,
    @Body() approveGradeDto: ApproveGradeDto,
  ) {
    if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(req.user.role)) {
      throw new ForbiddenException('Only teachers and admins can approve grades.');
    }
    return this.examService.approveGrade(req.user.tenantId, logId, req.user.userId, approveGradeDto);
  }
}