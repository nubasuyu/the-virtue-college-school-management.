import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExamService {
  constructor(private prisma: PrismaService) {}

   async createExam(tenantId: string, termId: string, name: string, assessmentType: string, subjectId: string, classId: string, date: string, totalMarks: number) {
    return this.prisma.exam.create({
      data: { tenantId, termId, name, assessmentType, subjectId, classId, date: new Date(date), totalMarks },
      include: { subject: true, class: true, term: true },
    });
  }

  async getClassExams(tenantId: string, classId: string) {
    return this.prisma.exam.findMany({
      where: { tenantId, classId },
      include: { subject: true, class: true },
      orderBy: { date: 'desc' },
    });
  }

  async getExamById(tenantId: string, examId: string) {
    return this.prisma.exam.findFirst({
      where: { id: examId, tenantId },
      include: { subject: true, class: true, grades: { include: { student: true } } },
    });
  }
}