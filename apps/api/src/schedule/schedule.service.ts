import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async createSchedule(
    tenantId: string,
    data: {
      classId: string;
      subjectId: string;
      teacherId: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      roomName?: string;
      termId?: string;
    }
  ) {
    // 1. Check for Teacher Clashes
    const teacherClash = await this.prisma.schedule.findFirst({
      where: {
        tenantId,
        teacherId: data.teacherId,
        dayOfWeek: data.dayOfWeek,
        termId: data.termId || null,
        startTime: { lt: data.endTime },
        endTime: { gt: data.startTime },
      },
    });

    if (teacherClash) {
      throw new ConflictException('This teacher is already teaching at this time!');
    }

    // 2. Check for Class Clashes
    const classClash = await this.prisma.schedule.findFirst({
      where: {
        tenantId,
        classId: data.classId,
        dayOfWeek: data.dayOfWeek,
        termId: data.termId || null,
        startTime: { lt: data.endTime },
        endTime: { gt: data.startTime },
      },
    });

    if (classClash) {
      throw new ConflictException('This class already has a lesson at this time!');
    }

    // 3. Create the schedule
    return this.prisma.schedule.create({
      data: {
        tenantId,
        classId: data.classId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        roomName: data.roomName,
        termId: data.termId,
      },
      include: {
        class: true,
        subject: true,
        teacher: true, 
        term: true,
      },
    });
  }

  async getClassTimetable(tenantId: string, classId: string, termId?: string) {
    return this.prisma.schedule.findMany({
      where: { tenantId, classId, termId: termId || null },
      include: { subject: true, teacher: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async getTeacherTimetable(tenantId: string, teacherId: string, termId?: string) {
    return this.prisma.schedule.findMany({
      where: { tenantId, teacherId, termId: termId || null },
      include: { class: true, subject: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async getAllSchedules(tenantId: string, termId?: string) {
    return this.prisma.schedule.findMany({
      where: { tenantId, termId: termId || null },
      include: { class: true, subject: true, teacher: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }
}