import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // Mark attendance for multiple students in a class on a specific date
  async markAttendance(
    tenantId: string,
    classId: string,
    date: string,
    records: { studentId: string; status: AttendanceStatus; notes?: string }[]
  ) {
    // Verify class belongs to tenant
    const classRecord = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classRecord || classRecord.tenantId !== tenantId) {
      throw new NotFoundException('Class not found or access denied');
    }

    // Use a transaction to upsert (create or update) all records at once
    return this.prisma.$transaction(
      records.map((record) =>
        this.prisma.attendance.upsert({
          where: {
            studentId_classId_date: {
              studentId: record.studentId,
              classId: classId,
              date: new Date(date),
            },
          },
          update: {
            status: record.status,
            notes: record.notes,
          },
          create: {
            tenantId,
            studentId: record.studentId,
            classId: classId,
            date: new Date(date),
            status: record.status,
            notes: record.notes,
          },
        })
      )
    );
  }

  // Get attendance for a specific class on a specific date
  async getClassAttendance(tenantId: string, classId: string, date: string) {
    const classRecord = await this.prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classRecord || classRecord.tenantId !== tenantId) {
      throw new NotFoundException('Class not found or access denied');
    }

    return this.prisma.attendance.findMany({
      where: {
        classId: classId,
        date: new Date(date),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNo: true,
          },
        },
      },
      orderBy: {
        student: {
          lastName: 'asc',
        },
      },
    });
  }

  // Get attendance history for a specific student
  async getStudentAttendance(tenantId: string, studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.tenantId !== tenantId) {
      throw new NotFoundException('Student not found or access denied');
    }

    return this.prisma.attendance.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            section: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }
}