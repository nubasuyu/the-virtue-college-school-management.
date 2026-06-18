import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeesService {
  constructor(private prisma: PrismaService) {}

  // Create a fee structure for a class and term
  async createFeeStructure(
    tenantId: string,
    data: {
      name: string;
      amount: number;
      currency?: string;
      classId: string;
      termId: string;
      description?: string;
      dueDate?: string;
    }
  ) {
    return this.prisma.feeStructure.create({
      data: {
        tenantId,
        name: data.name,
        amount: data.amount,
        currency: data.currency || 'USD',
        classId: data.classId,
        termId: data.termId,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        class: true,
        term: true,
      },
    });
  }

  // Get all fee structures for a class and term
  async getFeeStructures(tenantId: string, classId: string, termId: string) {
    return this.prisma.feeStructure.findMany({
      where: { tenantId, classId, termId },
      include: {
        class: true,
        term: true,
        payments: true,
      },
    });
  }

  // Record a payment for a student
  async recordPayment(
    tenantId: string,
    data: {
      studentId: string;
      feeStructureId?: string;
      amount: number;
      currency?: string;
      paymentMethod: string;
      reference?: string;
      remarks?: string;
    }
  ) {
    return this.prisma.payment.create({
      data: {
        tenantId,
        studentId: data.studentId,
        feeStructureId: data.feeStructureId,
        amount: data.amount,
        currency: data.currency || 'USD',
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        remarks: data.remarks,
      },
      include: {
        student: true,
        feeStructure: true,
      },
    });
  }

  // Get all payments for a student
  async getStudentPayments(tenantId: string, studentId: string) {
    return this.prisma.payment.findMany({
      where: { studentId },
      include: {
        feeStructure: {
          include: {
            term: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  // Calculate outstanding balance for a student in a term (Grouped by Currency)
  async calculateBalance(
    tenantId: string,
    studentId: string,
    termId: string
  ) {
    // Get the student's current class
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    if (!student.currentClassId) {
      throw new Error('Student has not been assigned to a class yet');
    }

    // Get all fee structures for the student's class and term
    const feeStructures = await this.prisma.feeStructure.findMany({
      where: {
        tenantId,
        classId: student.currentClassId,
        termId,
      },
    });

    // Get all payments made by the student for this term
    const payments = await this.prisma.payment.findMany({
      where: {
        studentId,
        feeStructure: {
          termId,
        },
      },
    });

    // --- NEW LOGIC: Group by Currency ---
    
    // 1. Group fees by currency
    const feesByCurrency: Record<string, number> = {};
    feeStructures.forEach((fee) => {
      const curr = fee.currency || 'USD';
      feesByCurrency[curr] = (feesByCurrency[curr] || 0) + fee.amount;
    });

    // 2. Group payments by currency
    const paymentsByCurrency: Record<string, number> = {};
    payments.forEach((payment) => {
      const curr = payment.currency || 'USD';
      paymentsByCurrency[curr] = (paymentsByCurrency[curr] || 0) + payment.amount;
    });

    // 3. Calculate balances per currency
    const balancesByCurrency: Record<string, number> = {};
    const allCurrencies = new Set([
      ...Object.keys(feesByCurrency),
      ...Object.keys(paymentsByCurrency),
    ]);

    allCurrencies.forEach((curr) => {
      const totalFee = feesByCurrency[curr] || 0;
      const totalPaid = paymentsByCurrency[curr] || 0;
      balancesByCurrency[curr] = totalFee - totalPaid;
    });

    return {
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
      },
      termId,
      feeBreakdown: feeStructures.map((fee) => ({
        name: fee.name,
        amount: fee.amount,
        currency: fee.currency,
        dueDate: fee.dueDate,
      })),
      paymentHistory: payments.map((payment) => ({
        amount: payment.amount,
        currency: payment.currency,
        date: payment.paymentDate,
        method: payment.paymentMethod,
        reference: payment.reference,
      })),
      balancesByCurrency, // e.g., { USD: 200, NGN: 250000 }
    };
  }

  // Delete a fee structure
  async deleteFeeStructure(tenantId: string, id: string) {
    return this.prisma.feeStructure.delete({
      where: { id, tenantId },
    });
  }
}