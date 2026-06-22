import { Controller, Post, Get, Body, Param, Req, UseGuards, ForbiddenException, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
// 👇 Make sure this path matches your other controllers (like class.controller.ts)
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

   @Post('mark')
  markAttendance(@Req() req: any, @Body() body: any) {
    // 🔒 RBAC: Force student to only mark themselves
    if (req.user.role === 'STUDENT') {
      body.studentId = req.user.id; 
    }

    // 👇 FIXED: Pass only 2 arguments - tenantId and the body object 👇
    return this.attendanceService.markAttendance(req.user.tenantId, body);
  }
  @Get('class/:classId')
  getClassAttendance(
    @Req() req: any, 
    @Param('classId') classId: string,
    @Query('date') date: string // 👇 FIX 2: Added date from URL query params 👇
  ) {
    // 🔒 RBAC: Block students from viewing the whole class
    if (req.user.role === 'STUDENT') {
      throw new ForbiddenException('Students cannot view full class attendance.');
    }
    
    // Default to today's date if no date is provided in the URL
    const attendanceDate = date || new Date().toISOString().split('T')[0];
    
    // Now we pass all 3 arguments: tenantId, classId, and date
    return this.attendanceService.getClassAttendance(req.user.tenantId, classId, attendanceDate);
  }

  @Get('student/:studentId')
  getStudentAttendance(@Req() req: any, @Param('studentId') studentId: string) {
    // 🔒 RBAC: Students can ONLY view their own records
    if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
      throw new ForbiddenException('You can only view your own attendance.');
    }
    return this.attendanceService.getStudentAttendance(req.user.tenantId, studentId);
  }
}