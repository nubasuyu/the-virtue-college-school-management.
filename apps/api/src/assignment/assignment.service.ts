import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssignmentService {
  constructor(private prisma: PrismaService) {}

  // Teacher creates an assignment for a class
  async createAssignment(
    tenantId: string,
    data: {
      title: string;
      description?: string;
      subjectId: string;
      classId: string;
      teacherId: string;
      dueDate: string;
      totalMarks?: number;
    }
  ) {
    return this.prisma.assignment.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description,
        subjectId: data.subjectId,
        classId: data.classId,
        teacherId: data.teacherId,
        dueDate: new Date(data.dueDate),
        totalMarks: data.totalMarks || 100,
      },
      include: {
        subject: true,
        class: true,
        teacher: true,
      },
    });
  }

  // Get all assignments for a specific class
  async getClassAssignments(tenantId: string, classId: string) {
    return this.prisma.assignment.findMany({
      where: { tenantId, classId },
      include: {
        subject: true,
        teacher: true,
        submissions: true, 
      },
      orderBy: { dueDate: 'desc' },
    });
  }

  // Student submits an assignment
  async submitAssignment(
    tenantId: string,
    assignmentId: string,
    studentId: string,
    content: string
  ) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.prisma.submission.create({
      data: {
        tenantId,
        assignmentId,
        studentId,
        content,
      },
      include: {
        assignment: true,
        student: true,
      },
    });
  }

  // Teacher grades a student's submission
  async gradeSubmission(
    tenantId: string,
    submissionId: string,
    marksObtained: number,
    feedback?: string
  ) {
    return this.prisma.submission.update({
      where: { id: submissionId },
      data: { marksObtained, feedback },
      include: {
        assignment: true,
        student: true,
      },
    });
  }

  // Get all submissions for a specific student
  async getStudentSubmissions(tenantId: string, studentId: string) {
    return this.prisma.submission.findMany({
      where: { studentId },
      include: {
        assignment: {
          include: { subject: true, class: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }
}