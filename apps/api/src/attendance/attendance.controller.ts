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

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ==========================================
  // 👇 NEW: BIOMETRIC / FINGERPRINT SCAN ENDPOINT
  // ==========================================
  @Post('biometric-scan')
  async handleBiometricScan(@Body() body: { biometricId: string; deviceName?: string }) {
    // Note: If your local fingerprint scanner software cannot send a JWT token, 
    // you can remove the @UseGuards(JwtAuthGuard) decorator from the top of this class, 
    // or apply it per-route instead of class-wide.
    return this.attendanceService.processBiometricScan(body.biometricId, body.deviceName);
  }

  // ==========================================
  // MANUAL ATTENDANCE MARKING
  // ==========================================
  @Post('mark')
  async markAttendance(@Req() req: any, @Body() body: any) {
    // 🔒 RBAC: Force student to only mark themselves
    if (req.user.role === 'STUDENT') {
      body.studentId = req.user.userId; // ✅ FIXED: Use userId from JWT payload
    }

    return this.attendanceService.markAttendance(req.user.tenantId, body);
  }

  // ==========================================
  // FETCHING ATTENDANCE RECORDS
  // ==========================================
  @Get('class/:classId')
  async getClassAttendance(
    @Req() req: any, 
    @Param('classId') classId: string,
    @Query('date') date: string
  ) {
    // 🔒 RBAC: Block students from viewing the whole class
    if (req.user.role === 'STUDENT') {
      throw new ForbiddenException('Students cannot view full class attendance.');
    }
    
    // Default to today's date if no date is provided in the URL
    const attendanceDate = date || new Date().toISOString().split('T')[0];
    
    return this.attendanceService.getClassAttendance(req.user.tenantId, classId, attendanceDate);
  }

  @Get('student/:studentId')
  async getStudentAttendance(@Req() req: any, @Param('studentId') studentId: string) {
    // 🔒 RBAC: Students can ONLY view their own records
    if (req.user.role === 'STUDENT' && req.user.userId !== studentId) { // ✅ FIXED
      throw new ForbiddenException('You can only view your own attendance.');
    }
    return this.attendanceService.getStudentAttendance(req.user.tenantId, studentId);
  }

  // 👇 NEW: Get ALL STAFF attendance for a specific date (For Admin/Principal Dashboard)
  @Get('staff')
  async getStaffAttendance(@Req() req: any, @Query('date') date: string) {
    if (req.user.role === 'STUDENT' || req.user.role === 'PARENT') {
      throw new ForbiddenException('Access denied.');
    }
    
    const attendanceDate = date || new Date().toISOString().split('T')[0];
    return this.attendanceService.getStaffAttendance(req.user.tenantId, attendanceDate);
  }

  // 👇 NEW: Get specific staff member attendance history
  @Get('user/:userId')
  async getUserAttendance(@Req() req: any, @Param('userId') userId: string) {
    // Staff can view their own, Admins can view anyone's
    if (req.user.role === 'STUDENT' || req.user.role === 'PARENT') {
      throw new ForbiddenException('Access denied.');
    }
    
    return this.attendanceService.getUserAttendance(req.user.tenantId, userId);
  }
}