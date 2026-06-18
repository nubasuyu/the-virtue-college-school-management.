import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('assignment')
@UseGuards(JwtAuthGuard)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  // Create assignment
  @Post()
  async createAssignment(@Request() req: any, @Body() body: any) {
    return this.assignmentService.createAssignment(req.user.tenantId, body);
  }

  // Get assignments for a class
  @Get('class/:classId')
  async getClassAssignments(
    @Request() req: any,
    @Param('classId') classId: string
  ) {
    return this.assignmentService.getClassAssignments(
      req.user.tenantId,
      classId
    );
  }

  // Submit assignment
  @Post(':assignmentId/submit')
  async submitAssignment(
    @Request() req: any,
    @Param('assignmentId') assignmentId: string,
    @Body() body: { studentId: string; content: string }
  ) {
    return this.assignmentService.submitAssignment(
      req.user.tenantId,
      assignmentId,
      body.studentId,
      body.content
    );
  }

  // Grade submission
  @Patch('submission/:submissionId/grade')
  async gradeSubmission(
    @Request() req: any,
    @Param('submissionId') submissionId: string,
    @Body() body: { marksObtained: number; feedback?: string }
  ) {
    return this.assignmentService.gradeSubmission(
      req.user.tenantId,
      submissionId,
      body.marksObtained,
      body.feedback
    );
  }

  // Get student's submissions
  @Get('student/:studentId')
  async getStudentSubmissions(
    @Request() req: any,
    @Param('studentId') studentId: string
  ) {
    return this.assignmentService.getStudentSubmissions(
      req.user.tenantId,
      studentId
    );
  }
}