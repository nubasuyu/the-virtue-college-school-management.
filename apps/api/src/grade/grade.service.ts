import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GradeService {
  constructor(private prisma: PrismaService) {}

  // Record a grade for a student
    async recordGrade(tenantId: string, termId: string, examId: string, studentId: string, marksObtained: number, remarks?: string) {
    return this.prisma.grade.create({
      data: { tenantId, termId, examId, studentId, marksObtained, remarks },
      include: { exam: true, student: true, term: true },
    });
  }
  // Get all grades for a student
  async getStudentGrades(tenantId: string, studentId: string) {
    return this.prisma.grade.findMany({
      where: { tenantId, studentId },
      include: {
        exam: {
          include: {
            subject: true,
            class: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Update a grade
  async updateGrade(
    tenantId: string,
    gradeId: string,
    marksObtained: number,
    remarks?: string
  ) {
    return this.prisma.grade.updateMany({
      where: { id: gradeId, tenantId },
      data: { marksObtained, remarks },
    });
  }
}