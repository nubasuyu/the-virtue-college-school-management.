import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportCardService {
  constructor(private prisma: PrismaService) {}

  private getGradeAndRemark(score: number) {
    if (score >= 80) return { grade: 'A', remark: 'EXCELLENT' };
    if (score >= 70) return { grade: 'B', remark: 'V.GOOD' };
    if (score >= 60) return { grade: 'C', remark: 'GOOD' };
    if (score >= 55) return { grade: 'D', remark: 'FAIR' };
    if (score >= 50) return { grade: 'E', remark: 'AVERAGE' };
    if (score >= 40) return { grade: 'F', remark: 'B. AVERAGE' };
    return { grade: 'G', remark: 'POOR' };
  }

  async generateReportCard(tenantId: string, studentId: string, termId: string) {
    // 1. Get Student, Term, and Session details
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
      include: { currentClass: true, tenant: true },
    });

    const term = await this.prisma.term.findFirst({
      where: { id: termId, tenantId },
      include: { session: true },
    });

    if (!student || !term) {
      throw new NotFoundException('Student or Term not found');
    }

    // Check if student has a class assigned
    if (!student.currentClassId) {
      throw new NotFoundException('Student is not assigned to any class');
    }

    const sessionId = term.sessionId;
    const enrollmentTerm = student.enrollmentTerm || 1;

    // Determine current term number (1, 2, or 3)
    const currentTermNumber = term.name.toLowerCase().includes('first') ? 1 : 
                              term.name.toLowerCase().includes('second') ? 2 : 3;

    // 2. Determine which terms to average based on enrollment
    const termsToAverage = [];
    for (let i = enrollmentTerm; i <= currentTermNumber; i++) {
      const t = await this.prisma.term.findFirst({
        where: { 
          sessionId: sessionId,
          name: { contains: i === 1 ? 'First' : i === 2 ? 'Second' : 'Third', mode: 'insensitive' } 
        }
      });
      if (t) termsToAverage.push(t);
    }

    // 3. Fetch Subjects for the Class/Tenant
    const subjects = await this.prisma.subject.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    });

    // 4. Calculate Scores for Each Subject
    const subjectResults = [];
    let totalAggregate = 0;
    let subjectCount = 0;

    for (const subject of subjects) {
      let currentTermCA1 = 0;
      let currentTermCA2 = 0;
      let currentTermExam = 0;
      let currentTermTotal = 0;
      
      let sumOfAllTermTotals = 0;
      let validTermsCount = 0;
      let previousTermScore = null;

      for (let idx = 0; idx < termsToAverage.length; idx++) {
        const t = termsToAverage[idx];
        
        const exams = await this.prisma.exam.findMany({
          where: {
            subjectId: subject.id,
            classId: student.currentClassId, // Now safe because of the check above
            termId: t.id
          }
        });

        let termTotal = 0;
        for (const exam of exams) {
          const grade = await this.prisma.grade.findFirst({
            where: { examId: exam.id, studentId: studentId }
          });
          
          if (grade) {
            const score = grade.marksObtained || 0;
            termTotal += score;
            
            // If it's the CURRENT term, split into columns
            if (t.id === termId) {
              const type = exam.assessmentType.toUpperCase();
              if (type.includes('CA1')) currentTermCA1 += score;
              else if (type.includes('CA2')) currentTermCA2 += score;
              else if (type.includes('EXAM') || type.includes('FINAL')) currentTermExam += score;
            }
          }
        }
        
        sumOfAllTermTotals += termTotal;
        validTermsCount++;

        if (t.id === termId) {
          currentTermTotal = termTotal;
        }

        // Capture previous term score (the term right before the current one)
        if (idx === termsToAverage.length - 2) {
          previousTermScore = termTotal;
        }
      }

      // Calculate Average (only for terms the student was actually present for)
      const average = validTermsCount > 0 ? (sumOfAllTermTotals / validTermsCount) : 0;
      const { grade, remark } = this.getGradeAndRemark(average);

      subjectResults.push({
        subjectName: subject.name,
        ca1: currentTermCA1,
        ca2: currentTermCA2,
        exam: currentTermExam,
        total: currentTermTotal,
        previousTermScore: previousTermScore,
        average: average.toFixed(2),
        grade,
        remark
      });

      totalAggregate += average;
      subjectCount++;
    }

    const finalAverage = subjectCount > 0 ? (totalAggregate / subjectCount).toFixed(2) : "0.00";

    // 5. Fetch Attendance (without termId filter if it doesn't exist)
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: { 
        studentId: studentId,
        // Remove termId if it doesn't exist in your Attendance model
        // If it does exist, you can add it back: termId: termId
      },
    });

    // 6. Fetch Behavior & Comments (these will work after prisma generate)
    let behavior = null;
    let comments = null;
    
    try {
      behavior = await this.prisma.behaviorScore.findFirst({
        where: { studentId, termId, sessionId }
      });
    } catch (e) {
      console.log('BehaviorScore not available yet');
    }
    
    try {
      comments = await this.prisma.reportComment.findFirst({
        where: { studentId, termId, sessionId }
      });
    } catch (e) {
      console.log('ReportComment not available yet');
    }

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        currentClass: student.currentClass ? `${student.currentClass.name} ${student.currentClass.section}` : 'Unassigned',
        enrollmentTerm
      },
      academicInfo: {
        session: term.session.name,
        term: term.name,
      },
      subjects: subjectResults,
      finalAverage: parseFloat(finalAverage),
      attendance: {
        present: attendanceRecords.filter((a) => a.status === 'PRESENT').length,
        absent: attendanceRecords.filter((a) => a.status === 'ABSENT').length,
        late: attendanceRecords.filter((a) => a.status === 'LATE').length,
        total: attendanceRecords.length,
      },
      behavior,
      comments
    };
  }
}