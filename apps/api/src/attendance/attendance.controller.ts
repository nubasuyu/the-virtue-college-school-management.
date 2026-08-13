import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Req, 
  UseGuards, 
  ForbiddenException, 
  Query 
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ==========================================
  // 👇 QR CODE SCAN ENDPOINT (NEW)
  // ==========================================
  @Post('scan')
  @UseGuards(JwtAuthGuard)
  async scanQRCode(@Req() req: any, @Body() body: { admissionNo: string }) {
    return this.attendanceService.markAttendanceByAdmissionNo(
      req.user.tenantId, 
      body.admissionNo
    );
  }

  // ==========================================
  // 👇 BIOMETRIC / FINGERPRINT SCAN ENDPOINT (NO AUTH GUARD)
  // ==========================================
  @Post('biometric-scan')
  async handleBiometricScan(@Body() body: { biometricId: string; deviceName?: string }) {
    // Intentionally left WITHOUT @UseGuards(JwtAuthGuard) 
    // so the local USB scanner middleware can send data without a JWT token.
    return this.attendanceService.processBiometricScan(body.biometricId, body.deviceName);
  }

  // ==========================================
  // MANUAL ATTENDANCE MARKING
  // ==========================================
  @Post('mark')
  @UseGuards(JwtAuthGuard) // 👈 Guard applied here
  async markAttendance(@Req() req: any, @Body() body: any) {
    if (req.user.role === 'STUDENT') {
      body.studentId = req.user.userId;
    }
    return this.attendanceService.markAttendance(req.user.tenantId, body);
  }

  // ==========================================
  // FETCHING ATTENDANCE RECORDS
  // ==========================================
  @Get('class/:classId')
  @UseGuards(JwtAuthGuard) // 👈 Guard applied here
  async getClassAttendance(
    @Req() req: any, 
    @Param('classId') classId: string,
    @Query('date') date: string
  ) {
    if (req.user.role === 'STUDENT') {
      throw new ForbiddenException('Students cannot view full class attendance.');
    }
    const attendanceDate = date || new Date().toISOString().split('T')[0];
    return this.attendanceService.getClassAttendance(req.user.tenantId, classId, attendanceDate);
  }

  @Get('student/:studentId')
  @UseGuards(JwtAuthGuard) // 👈 Guard applied here
  async getStudentAttendance(@Req() req: any, @Param('studentId') studentId: string) {
    if (req.user.role === 'STUDENT' && req.user.userId !== studentId) {
      throw new ForbiddenException('You can only view your own attendance.');
    }
    return this.attendanceService.getStudentAttendance(req.user.tenantId, studentId);
  }

  @Get('staff')
  @UseGuards(JwtAuthGuard) // 👈 Guard applied here
  async getStaffAttendance(@Req() req: any, @Query('date') date: string) {
    if (req.user.role === 'STUDENT' || req.user.role === 'PARENT') {
      throw new ForbiddenException('Access denied.');
    }
    const attendanceDate = date || new Date().toISOString().split('T')[0];
    return this.attendanceService.getStaffAttendance(req.user.tenantId, attendanceDate);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard) // 👈 Guard applied here
  async getUserAttendance(@Req() req: any, @Param('userId') userId: string) {
    if (req.user.role === 'STUDENT' || req.user.role === 'PARENT') {
      throw new ForbiddenException('Access denied.');
    }
    return this.attendanceService.getUserAttendance(req.user.tenantId, userId);
  }
}