import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromotionService {
  constructor(private prisma: PrismaService) {}

  // Promote a single student to a new class
  async promoteStudent(
    tenantId: string,
    studentId: string,
    newClassId: string,
    sessionId: string
  ) {
    // Get the student's current class
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Record the promotion in class history
    const classHistory = await this.prisma.classHistory.create({
      data: {
        studentId,
        classId: student.currentClassId || newClassId, // Record current class
        sessionId,
        promoted: true,
      },
      include: {
        student: true,
        class: true,
        session: true,
      },
    });

    // Update the student's current class
    const updatedStudent = await this.prisma.student.update({
      where: { id: studentId },
      data: { currentClassId: newClassId },
      include: {
        currentClass: true,
      },
    });

    return {
      message: 'Student promoted successfully',
      student: updatedStudent,
      history: classHistory,
    };
  }

  // Bulk promote all students from one class to another
  async bulkPromoteClass(
    tenantId: string,
    fromClassId: string,
    toClassId: string,
    sessionId: string
  ) {
    // Get all students in the source class
    const students = await this.prisma.student.findMany({
      where: { tenantId, currentClassId: fromClassId },
    });

    const results = [];

    for (const student of students) {
      // Record promotion in history
      await this.prisma.classHistory.create({
        data: {
          studentId: student.id,
          classId: fromClassId,
          sessionId,
          promoted: true,
        },
      });

      // Update student's current class
      const updatedStudent = await this.prisma.student.update({
        where: { id: student.id },
        data: { currentClassId: toClassId },
      });

      results.push({
        studentId: student.id,
        name: `${student.firstName} ${student.lastName}`,
        promoted: true,
      });
    }

    return {
      message: `Successfully promoted ${results.length} students`,
      promotedStudents: results,
    };
  }

  // Get promotion history for a student
  async getStudentPromotionHistory(tenantId: string, studentId: string) {
    return this.prisma.classHistory.findMany({
      where: { studentId },
      include: {
        class: true,
        session: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get all promotions for a session
  async getSessionPromotions(tenantId: string, sessionId: string) {
    return this.prisma.classHistory.findMany({
      where: { sessionId, promoted: true },
      include: {
        student: true,
        class: true,
        session: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}