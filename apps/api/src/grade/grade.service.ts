import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GradeService {
  constructor(private prisma: PrismaService) {}

  private calculateGradeAndRemark(marksObtained: number, totalMarks: number) {
    const percentage = (marksObtained / totalMarks) * 100;
    
    if (percentage >= 75) return { grade: 'A', remarks: 'Excellent' };
    if (percentage >= 65) return { grade: 'B', remarks: 'Very Good' };
    if (percentage >= 50) return { grade: 'C', remarks: 'Good' };
    if (percentage >= 40) return { grade: 'D', remarks: 'Fair' };
    return { grade: 'F', remarks: 'Fail' };
  }

  async getGradesForExam(tenantId: string, examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId, tenantId },
      include: { class: true, subject: true },
    });

    if (!exam) throw new NotFoundException('Exam not found');

    const students = await this.prisma.student.findMany({
      where: { tenantId, currentClassId: exam.classId },
      orderBy: { firstName: 'asc' },
    });

    const grades = await this.prisma.grade.findMany({
      where: { tenantId, examId },
    });

    return students.map(student => {
      const studentGrade = grades.find(g => g.studentId === student.id);
      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        mcqScore: studentGrade?.mcqScore || 0,
        theoryScore: studentGrade?.theoryScore || 0,
        marksObtained: studentGrade?.marksObtained || 0,
        grade: studentGrade?.grade || '-',
        remarks: studentGrade?.remarks || '-',
        totalMarks: exam.totalMarks,
      };
    });
  }

  async saveGrade(
    tenantId: string,
    data: { examId: string; studentId: string; mcqScore?: number; theoryScore?: number }
  ) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: data.examId },
    });

    if (!exam) throw new NotFoundException('Exam not found');

    const existing = await this.prisma.grade.findFirst({
      where: { tenantId, examId: data.examId, studentId: data.studentId },
    });

    // Use the new value if provided, otherwise keep the existing one
    const newMcq = data.mcqScore !== undefined ? data.mcqScore : (existing?.mcqScore || 0);
    const newTheory = data.theoryScore !== undefined ? data.theoryScore : (existing?.theoryScore || 0);
    
    // CRITICAL FIX: Calculate total correctly
    const marksObtained = newMcq + newTheory;

    const { grade, remarks } = this.calculateGradeAndRemark(marksObtained, exam.totalMarks);

    return this.prisma.grade.upsert({
      where: {
        examId_studentId: {
          examId: data.examId,
          studentId: data.studentId,
        },
      },
      update: {
        mcqScore: newMcq,
        theoryScore: newTheory,
        marksObtained,
        grade,
        remarks,
      },
      create: {
        tenantId,
        examId: data.examId,
        studentId: data.studentId,
        termId: exam.termId,
        mcqScore: newMcq,
        theoryScore: newTheory,
        marksObtained,
        grade,
        remarks,
      },
    });
  }

  async getExamsForClass(tenantId: string, classId: string) {
    return this.prisma.exam.findMany({
      where: { tenantId, classId },
      include: { subject: true, term: true },
      orderBy: { date: 'desc' },
    });
  }
}