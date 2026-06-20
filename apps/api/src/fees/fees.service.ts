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
        // 👇 PROVIDE A DEFAULT DESCRIPTION IF MISSING 👇
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

    return this.prisma.feeStructure.findMany({
      where,
      include: { class: true, term: true },
    });
  }

  async getFeeStructure(tenantId: string, id: string) {
    const fee = await this.prisma.feeStructure.findUnique({
      where: { id },
      include: { class: true, term: true },
    });

    if (!fee) throw new NotFoundException('Fee structure not found');
    if (fee.tenantId !== tenantId) throw new ForbiddenException('Access denied');

    return fee;
  }

  async updateFeeStructure(tenantId: string, id: string, data: any) {
    await this.getFeeStructure(tenantId, id);
    const { classId, termId, ...rest } = data;

    return this.prisma.feeStructure.update({
      where: { id },
      data: {
        ...rest,
        // 👇 PROVIDE A DEFAULT DESCRIPTION IF MISSING 👇
        description: data.description || 'General Fee', 
        class: classId ? { connect: { id: classId } } : undefined,
        term: termId ? { connect: { id: termId } } : undefined,
      },
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
      data: {
        ...rest,
        tenantId,
        amount: parseFloat(data.amount),
        // 👇 ADD THIS LINE TO DEFAULT TO 'CASH' 👇
        paymentMethod: data.paymentMethod || 'CASH', 
        student: studentId ? { connect: { id: studentId } } : undefined,
        feeStructure: feeStructureId ? { connect: { id: feeStructureId } } : undefined,
      },
      include: { student: true, feeStructure: true },
    });
  }
  async getStudentPayments(tenantId: string, studentId: string) {
    return this.prisma.payment.findMany({
      where: { tenantId, studentId },
      include: { feeStructure: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async calculateBalance(tenantId: string, studentId: string, termId?: string) {
    return { totalFees: 0, totalPaid: 0, balance: 0 }; 
  }

  async getAllPayments(tenantId: string) {
  return this.prisma.payment.findMany({
    where: { tenantId },
    include: { student: true, feeStructure: true },
    orderBy: { createdAt: 'desc' }, // Show newest payments first
  });
}
}