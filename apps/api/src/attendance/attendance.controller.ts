import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AttendanceStatus } from '@prisma/client';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // Mark attendance for multiple students
  @Post('mark')
  async markAttendance(
    @Request() req: any,
    @Body()
    body: {
      classId: string;
      date: string;
      records: { studentId: string; status: AttendanceStatus; notes?: string }[];
    }
  ) {
    return this.attendanceService.markAttendance(
      req.user.tenantId,
      body.classId,
      body.date,
      body.records
    );
  }

  // Get attendance for a class on a specific date
  @Get('class/:classId')
  async getClassAttendance(
    @Request() req: any,
    @Param('classId') classId: string,
    @Query('date') date: string
  ) {
    return this.attendanceService.getClassAttendance(
      req.user.tenantId,
      classId,
      date
    );
  }

  // Get attendance history for a student
  @Get('student/:studentId')
  async getStudentAttendance(
    @Request() req: any,
    @Param('studentId') studentId: string
  ) {
    return this.attendanceService.getStudentAttendance(
      req.user.tenantId,
      studentId
    );
  }
}