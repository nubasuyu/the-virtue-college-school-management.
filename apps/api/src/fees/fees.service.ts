import { Injectable, NotFoundException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeesService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.prisma.$executeRawUnsafe(`ALTER TABLE "FeeStructure" ALTER COLUMN "termId" DROP NOT NULL;`);
      await this.prisma.$executeRawUnsafe(`ALTER TABLE "FeeStructure" ALTER COLUMN "classId" DROP NOT NULL;`);
      console.log('✅ Successfully fixed database constraints for FeeStructure!');
    } catch (e) {
      // Ignore error if the columns are already nullable
    }
  }

  async createFeeStructure(tenantId: string, data: any) {
    const { classId, termId, ...rest } = data;
    return this.prisma.feeStructure.create({
      data: {
        ...rest,
        tenantId,
        description: data.description || 'General Fee', 
        class: classId ? { connect: { id: classId } } : undefined,
        term: termId ? { connect: { id: termId } } : undefined,
      },
      include: { class: true, term: true },
    });
  }

  async getFeeStructures(tenantId: string, classId?: string, termId?: string) {
    const where: any = { tenantId };
    if (classId) where.classId = classId;
    if (termId) where.termId = termId;
    return this.prisma.feeStructure.findMany({ where, include: { class: true, term: true } });
  }

  async getFeeStructure(tenantId: string, id: string) {
    const fee = await this.prisma.feeStructure.findUnique({ where: { id }, include: { class: true, term: true } });
    if (!fee) throw new NotFoundException('Fee structure not found');
    if (fee.tenantId !== tenantId) throw new ForbiddenException('Access denied');
    return fee;
  }

  async updateFeeStructure(tenantId: string, id: string, data: any) {
    await this.getFeeStructure(tenantId, id);
    const { classId, termId, ...rest } = data;
    return this.prisma.feeStructure.update({
      where: { id },
      data: { ...rest, description: data.description || 'General Fee', class: classId ? { connect: { id: classId } } : undefined, term: termId ? { connect: { id: termId } } : undefined },
      include: { class: true, term: true },
    });
  }

  async deleteFeeStructure(tenantId: string, id: string) {
    await this.getFeeStructure(tenantId, id);
    return this.prisma.feeStructure.delete({ where: { id } });
  }

  async recordPayment(tenantId: string, data: any) {
    const { studentId, feeStructureId, ...rest } = data;
    return this.prisma.payment.create({
      data: { ...rest, tenantId, amount: parseFloat(data.amount), paymentMethod: data.paymentMethod || 'CASH', student: studentId ? { connect: { id: studentId } } : undefined, feeStructure: feeStructureId ? { connect: { id: feeStructureId } } : undefined },
      include: { student: true, feeStructure: true },
    });
  }

  async getStudentPayments(tenantId: string, studentId: string) {
    return this.prisma.payment.findMany({ where: { tenantId, studentId }, include: { feeStructure: true }, orderBy: { createdAt: 'desc' } });
  }

  async getAllPayments(tenantId: string) {
    return this.prisma.payment.findMany({ where: { tenantId }, include: { student: true, feeStructure: true }, orderBy: { createdAt: 'desc' } });
  }

  async calculateBalance(tenantId: string, studentId: string, termId?: string) {
    return { totalFees: 0, totalPaid: 0, balance: 0 }; 
  }

  // ==========================================
  // 👇 UPDATED: PERSONALIZED STUDENT FEES (NO LOCKS)
  // ==========================================

  async getStudentFeeBreakdown(tenantId: string, studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId, tenantId },
      include: { currentClass: true }
    });

    if (!student || !student.currentClass) {
      throw new NotFoundException('Student or Class not found');
    }

    const defaultFees = await this.prisma.feeStructure.findMany({
      where: { ...(student.currentClassId ? { classId: student.currentClassId } : {}) }
    });

    const studentFees = await this.prisma.studentFee.findMany({
      where: { studentId },
      include: { feeStructure: true }
    });

    // 👇 EVERY FEE IS NOW TOGGLEABLE (Active or Waived)
    const breakdown = defaultFees.map(defaultFee => {
      const customFee = studentFees.find(sf => sf.feeStructureId === defaultFee.id);
      const isWaived = customFee?.isWaived ?? false;
      
      return {
        id: defaultFee.id,
        name: defaultFee.name,
        category: defaultFee.category || 'GENERAL',
        isOptional: defaultFee.isOptional,
        amount: customFee?.amount ?? defaultFee.amount,
        isWaived: isWaived,
        isActive: !isWaived, // 👈 Unified active state for UI
        finalAmount: isWaived ? 0 : (customFee?.amount ?? defaultFee.amount)
      };
    });

    const totalDue = breakdown.reduce((sum, fee: any) => sum + fee.finalAmount, 0);
    return { breakdown, totalDue };
  }

  async toggleStudentFee(tenantId: string, studentId: string, feeStructureId: string, isActive: boolean) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId, tenantId } });
    if (!student) throw new NotFoundException('Student not found');

    // 👇 Upsert allows us to Activate (isWaived: false) OR Waive (isWaived: true) ANY fee
    return this.prisma.studentFee.upsert({
      where: { studentId_feeStructureId: { studentId, feeStructureId } },
      update: { isWaived: !isActive },
      create: {
        studentId,
        feeStructureId,
        isWaived: !isActive
      }
    });
  }

  // ==========================================
  // 👇 UPDATED: PARENT FEE SUMMARY (Respects Waivers)
  // ==========================================
  async getStudentFeeSummary(tenantId: string, studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId, tenantId },
      select: { id: true, firstName: true, lastName: true, admissionNo: true, currentClassId: true }
    });

    if (!student) throw new NotFoundException('Student not found');

    const feeStructures = await this.prisma.feeStructure.findMany({
      where: { tenantId, ...(student.currentClassId ? { classId: student.currentClassId } : {}) },
      include: { class: true, term: true }
    });

    const studentFees = await this.prisma.studentFee.findMany({ where: { studentId }, include: { feeStructure: true } });
    const payments = await this.prisma.payment.findMany({ where: { tenantId, studentId }, orderBy: { paymentDate: 'desc' }, include: { feeStructure: true } });

    let totalExpected = 0;
    feeStructures.forEach(fee => {
      const customFee = studentFees.find(sf => sf.feeStructureId === fee.id);
      const isWaived = customFee?.isWaived ?? false;
      
      if (!isWaived) {
        totalExpected += (customFee?.amount ?? fee.amount);
      }
    });

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const balance = Math.max(0, totalExpected - totalPaid);

    return {
      student: { id: student.id, name: `${student.firstName} ${student.lastName}`, admissionNo: student.admissionNo },
      feeStructures,
      payments,
      summary: { totalExpected, totalPaid, balance }
    };
  }
}