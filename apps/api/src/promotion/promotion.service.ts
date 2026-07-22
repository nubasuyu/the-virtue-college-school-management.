import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromotionService {
  constructor(private prisma: PrismaService) {}

  async processPromotion(
    tenantId: string,
    data: {
      studentIds: string[];
      newClassId: string;
      sessionId: string; 
      status: 'PROMOTED' | 'REPEATED' | 'GRADUATED' | 'WITHDRAWN';
    }
  ) {
    const results = { success: 0, failed: 0, errors: [] as any[] };

    for (const studentId of data.studentIds) {
      let student: any = null; // Declared outside try block so catch can see it
      try {
        student = await this.prisma.student.findUnique({
          where: { id: studentId, tenantId },
          select: { currentClassId: true, id: true, firstName: true, lastName: true }
        });

        if (!student) {
          results.failed++;
          results.errors.push({ studentId, name: 'Unknown', reason: 'Student not found' });
          continue;
        }

        const oldClassId = student.currentClassId;

        if (oldClassId) {
          await this.prisma.academicHistory.create({
            data: {
              studentId: student.id,
              classId: oldClassId,
              sessionId: data.sessionId,
              status: data.status,
            }
          });
        }

        await this.prisma.student.update({
          where: { id: studentId },
          data: { currentClassId: data.newClassId }
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({ 
          studentId, 
          name: student ? `${student.firstName} ${student.lastName}` : 'Unknown', 
          reason: error.message 
        });
      }
    }

    return results;
  }

  async getStudentsByClass(tenantId: string, classId: string) {
    return this.prisma.student.findMany({
      where: { tenantId, currentClassId: classId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        admissionNo: true,
        currentClass: { select: { name: true, section: true } }
      },
      orderBy: { lastName: 'asc' }
    });
  }
}