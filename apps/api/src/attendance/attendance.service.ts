import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service'; // 👈 1. IMPORT EMAIL SERVICE

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService // 👈 2. INJECT EMAIL SERVICE
  ) {}

  // ==========================================
  // QR CODE SCANNING ATTENDANCE
  // ==========================================
  async markAttendanceByAdmissionNo(tenantId: string, admissionNo: string) {
    // 1. Find student by admission number and tenant
    const student = await this.prisma.student.findFirst({
      where: {
        admissionNo,
        tenantId,
      },
      include: {
        currentClass: true,
      }
    });

    if (!student) {
      return { success: false, message: 'Student not found. Please check the ID card.' };
    }

    // 2. Get today's date boundaries (midnight to midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 3. Check if attendance record already exists for this student today
    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        tenantId,
        studentId: student.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingAttendance) {
      return { 
        success: false, 
        message: `Attendance already marked for ${student.firstName} ${student.lastName} today.` 
      };
    }

    // 4. Determine status based on time (e.g., after 8:00 AM is LATE, else PRESENT)
    const now = new Date();
    const currentHour = now.getHours();
    const status = currentHour >= 8 ? 'LATE' : 'PRESENT';

    // 5. Create new attendance record
    const attendance = await this.prisma.attendance.create({
      data: {
        tenantId,
        studentId: student.id,
        classId: student.currentClassId,
        date: today,
        checkInTime: now,
        status: status as any,
      },
      include: {
        student: true,
        class: true,
      }
    });

        // 👇 6. NEW: Notify Parents via Email
    try {
      const studentParents = await this.prisma.studentParent.findMany({
        where: { studentId: student.id },
        include: { parent: true }
      });

      for (const link of studentParents) {
        if (link.parent.email) {
          // 👇 FIX: Pass 3 separate arguments instead of an object
          await this.emailService.sendEmail(
            link.parent.email,
            `✅ Attendance Alert: ${student.firstName} has arrived at school`,
            `
              <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #2c5282;">Attendance Notification</h2>
                <p>Dear ${link.parent.firstName || 'Parent'},</p>
                <p>Your child, <strong>${student.firstName} ${student.lastName}</strong>, has safely arrived at The Virtue College.</p>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Time:</strong> ${now.toLocaleTimeString()}</li>
                  <li><strong>Status:</strong> ${status}</li>
                </ul>
                <p>Thank you for trusting us with your child's education.</p>
              </div>
            `
          );
        }
      }
    } catch (emailError) {
      console.error('Failed to send parent notification:', emailError);
    }
    
    return { 
      success: true, 
      message: `✅ Attendance marked successfully for ${student.firstName} ${student.lastName} (${status})`,
      data: attendance
    };
  }

  // ==========================================
  // BIOMETRIC / FINGERPRINT SCANNING
  // ==========================================
  async processBiometricScan(biometricId: string, deviceName?: string) {
    const student = await this.prisma.student.findFirst({ where: { biometricId } });
    const user = await this.prisma.user.findFirst({ where: { biometricId } });

    if (!student && !user) {
      throw new NotFoundException('Fingerprint not recognized. Please enroll first.');
    }

    const isStudent = !!student;
    const personId = isStudent ? student!.id : user!.id;
    const classId = isStudent ? student!.currentClassId : null;
    const tenantId = isStudent ? student!.tenantId : user!.tenantId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let attendance = await this.prisma.attendance.findFirst({
      where: {
        tenantId,
        date: { gte: today, lt: tomorrow },
        ...(isStudent ? { studentId: personId } : { userId: personId }),
      },
    });

    const now = new Date();
    const currentHour = now.getHours();
    const status = currentHour >= 9 ? 'LATE' : 'PRESENT';

    if (!attendance) {
      attendance = await this.prisma.attendance.create({
        data: {
          tenantId,
          studentId: isStudent ? personId : null,
          userId: isStudent ? null : personId,
          classId,
          date: today,
          checkInTime: now,
          status: status as any,
          biometricId,
          deviceName,
        },
        include: {
          student: isStudent ? true : undefined,
          user: isStudent ? undefined : true,
          class: true,
        }
      });
      return { message: 'Check-in successful', status: attendance.status, type: 'CHECK_IN', data: attendance };
    } else {
      if (attendance.checkOutTime) {
        return { message: 'Already checked out for today', type: 'ALREADY_DONE', data: attendance };
      }

      if (attendance.checkInTime) {
        attendance = await this.prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            checkOutTime: now,
            deviceName: deviceName || attendance.deviceName,
          },
          include: {
            student: isStudent ? true : undefined,
            user: isStudent ? undefined : true,
            class: true,
          }
        });
        return { message: 'Check-out successful', type: 'CHECK_OUT', data: attendance };
      } else {
        attendance = await this.prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            checkInTime: now,
            status: status as any,
            deviceName: deviceName || attendance.deviceName,
          },
          include: {
            student: isStudent ? true : undefined,
            user: isStudent ? undefined : true,
            class: true,
          }
        });
        return { message: 'Check-in successful (overrode manual status)', status: attendance.status, type: 'CHECK_IN', data: attendance };
      }
    }
  }

  // ==========================================
  // MANUAL ATTENDANCE MARKING (Web Interface)
  // ==========================================
  async markAttendance(tenantId: string, data: any) {
    const { studentId, userId, classId, date, status, notes } = data;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        tenantId,
        date: targetDate,
        ...(studentId ? { studentId } : { userId }),
      },
    });

    if (existing) {
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: { status, notes },
        include: {
          student: studentId ? true : undefined,
          user: userId ? true : undefined,
          class: true,
        },
      });
    } else {
      return this.prisma.attendance.create({
        data: {
          tenantId,
          studentId: studentId || null,
          userId: userId || null,
          classId: classId || null,
          date: targetDate,
          status,
          notes,
        },
        include: {
          student: studentId ? true : undefined,
          user: userId ? true : undefined,
          class: true,
        },
      });
    }
  }

  // ==========================================
  // FETCHING ATTENDANCE RECORDS
  // ==========================================
  async getClassAttendance(tenantId: string, classId: string, date: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const tomorrow = new Date(targetDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.attendance.findMany({
      where: {
        tenantId,
        classId,
        date: { gte: targetDate, lt: tomorrow },
      },
      include: { student: true },
      orderBy: { student: { firstName: 'asc' } },
    });
  }

  async getStaffAttendance(tenantId: string, date: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const tomorrow = new Date(targetDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.attendance.findMany({
      where: {
        tenantId,
        userId: { not: null },
        date: { gte: targetDate, lt: tomorrow },
      },
      include: { user: true },
      orderBy: { user: { firstName: 'asc' } },
    });
  }

  async getStudentAttendance(tenantId: string, studentId: string) {
    return this.prisma.attendance.findMany({
      where: { tenantId, studentId },
      include: { class: true },
      orderBy: { date: 'desc' },
    });
  }

  async getUserAttendance(tenantId: string, userId: string) {
    return this.prisma.attendance.findMany({
      where: { tenantId, userId },
      include: { user: true },
      orderBy: { date: 'desc' },
    });
  }
}