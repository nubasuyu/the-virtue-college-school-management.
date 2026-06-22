import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // Mark attendance for a single student
  async markAttendance(tenantId: string, data: any) {
    const { studentId, classId, date, status } = data;

    // Check if attendance already exists for this student on this date
    const existing = await this.prisma.attendance.findFirst({
      where: {
        tenantId,
        studentId,
        classId,
        date: new Date(date),
      },
    });

    if (existing) {
      // Update existing record
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: { status },
        include: {
          student: true,
          class: true,
        },
      });
    } else {
      // Create new record
      return this.prisma.attendance.create({
        data: {
          tenantId,
          studentId,
          classId,
          date: new Date(date),
          status,
        },
        include: {
          student: true,
          class: true,
        },
      });
    }
  }

  // Get attendance for a specific class on a specific date
  async getClassAttendance(tenantId: string, classId: string, date: string) {
    return this.prisma.attendance.findMany({
      where: {
        tenantId,
        classId,
        date: new Date(date),
      },
      include: {
        student: true,
      },
      orderBy: {
        student: { firstName: 'asc' },
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
}