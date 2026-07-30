import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // BIOMETRIC / FINGERPRINT SCANNING
  // ==========================================
  async processBiometricScan(biometricId: string, deviceName?: string) {
    // 1. Find who this biometricId belongs to (Student or Staff User)
    const student = await this.prisma.student.findFirst({
      where: { biometricId },
    });

    const user = await this.prisma.user.findFirst({
      where: { biometricId },
    });

    if (!student && !user) {
      throw new NotFoundException('Fingerprint not recognized. Please enroll first.');
    }

    const isStudent = !!student;
    const personId = isStudent ? student!.id : user!.id;
    const classId = isStudent ? student!.currentClassId : null;
    const tenantId = isStudent ? student!.tenantId : user!.tenantId;

    // 2. Get today's date boundaries (midnight to midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 3. Check if attendance record already exists for this person today
    let attendance = await this.prisma.attendance.findFirst({
      where: {
        tenantId,
        date: {
          gte: today,
          lt: tomorrow,
        },
        ...(isStudent ? { studentId: personId } : { userId: personId }),
      },
    });

    const now = new Date();
    const currentHour = now.getHours();
    const status = currentHour >= 9 ? 'LATE' : 'PRESENT'; // Determine status based on time

    // 4. Determine Check-In (Morning) vs Check-Out (Afternoon)
    if (!attendance) {
      // Scenario A: First scan of the day. Create Check-In record.
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
      // Record already exists for today.
      
      if (attendance.checkOutTime) {
        // Scenario B: Already checked out. Do nothing.
        return { message: 'Already checked out for today', type: 'ALREADY_DONE', data: attendance };
      }

      if (attendance.checkInTime) {
        // Scenario C: Has a check-in time, but no check-out. This is the Check-Out scan.
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
        // Scenario D: Record exists (e.g., manually marked ABSENT/EXCUSED), but NO check-in time.
        // Override the manual status with the biometric Check-In.
        attendance = await this.prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            checkInTime: now,
            status: status as any, // 👈 THIS FIXES THE "STUCK ON BLUE" ISSUE
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

  // Get attendance for a specific class on a specific date
  async getClassAttendance(tenantId: string, classId: string, date: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const tomorrow = new Date(targetDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.attendance.findMany({
      where: {
        tenantId,
        classId,
        date: {
          gte: targetDate,
          lt: tomorrow,
        },
      },
      include: {
        student: true,
      },
      orderBy: {
        student: { firstName: 'asc' },
      },
    });
  }

  // Get attendance for ALL STAFF on a specific date
  async getStaffAttendance(tenantId: string, date: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const tomorrow = new Date(targetDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.attendance.findMany({
      where: {
        tenantId,
        userId: { not: null }, // Only fetch staff records
        date: {
          gte: targetDate,
          lt: tomorrow,
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        user: { firstName: 'asc' },
      },
    });
  }

  // Get attendance history for a specific student
  async getStudentAttendance(tenantId: string, studentId: string) {
    return this.prisma.attendance.findMany({
      where: {
        tenantId,
        studentId,
      },
      include: {
        class: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  // Get attendance history for a specific staff member
  async getUserAttendance(tenantId: string, userId: string) {
    return this.prisma.attendance.findMany({
      where: {
        tenantId,
        userId,
      },
      include: {
        user: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }
}