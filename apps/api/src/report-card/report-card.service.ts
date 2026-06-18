import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportCardService {
  constructor(private prisma: PrismaService) {}

  async generateReportCard(tenantId: string, studentId: string, termId: string) {
    // 1. Get Student, Term, and Session details
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
      include: { currentClass: true },
    });

    const term = await this.prisma.term.findFirst({
      where: { id: termId, tenantId },
      include: { session: true },
    });

    if (!student || !term) {
      throw new Error('Student or Term not found');
    }

    // 2. Get all grades for this student in this specific term
    const grades = await this.prisma.grade.findMany({
      where: { studentId, termId },
      include: {
        exam: {
          include: { subject: true },
        },
      },
    });

    // 3. Group grades by subject and calculate totals
    const subjectResults: Record<string, any> = {};
    let totalMarksObtained = 0;
    let totalMarksAvailable = 0;

    grades.forEach((grade) => {
      const subjectName = grade.exam.subject.name;
      if (!subjectResults[subjectName]) {
        subjectResults[subjectName] = {
          subject: subjectName,
          assessments: [],
          totalObtained: 0,
          totalAvailable: 0,
        };
      }

      subjectResults[subjectName].assessments.push({
        name: grade.exam.name,
        type: grade.exam.assessmentType,
        marksObtained: grade.marksObtained,
        totalMarks: grade.exam.totalMarks,
        remarks: grade.remarks,
      });

      subjectResults[subjectName].totalObtained += grade.marksObtained;
      subjectResults[subjectName].totalAvailable += grade.exam.totalMarks;
      
      totalMarksObtained += grade.marksObtained;
      totalMarksAvailable += grade.exam.totalMarks;
    });

    // 4. Get Attendance summary for the student
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: { studentId },
    });

    const attendanceSummary = {
      present: attendanceRecords.filter((a) => a.status === 'PRESENT').length,
      absent: attendanceRecords.filter((a) => a.status === 'ABSENT').length,
      late: attendanceRecords.filter((a) => a.status === 'LATE').length,
      total: attendanceRecords.length,
    };

    // 5. Calculate overall percentage
    const overallPercentage = totalMarksAvailable > 0 
      ? Math.round((totalMarksObtained / totalMarksAvailable) * 100) 
      : 0;

    // Return the compiled report card
    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        currentClass: student.currentClass ? `${student.currentClass.name} ${student.currentClass.section}` : 'Unassigned',
      },
      academicInfo: {
        session: term.session.name,
        term: term.name,
      },
      subjects: Object.values(subjectResults),
      attendance: attendanceSummary,
      summary: {
        totalMarksObtained,
        totalMarksAvailable,
        overallPercentage: `${overallPercentage}%`,
      },
    };
  }
}