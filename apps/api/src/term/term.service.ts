import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TermService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: { sessionId: string; name: string; number: number; startDate: string; endDate: string }) {
    return this.prisma.term.create({
      data: {
        tenantId,
        sessionId: data.sessionId,
        name: data.name,
        number: data.number,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
      include: { session: true },
    });
  }

  async findAll(tenantId: string, sessionId?: string) {
    return this.prisma.term.findMany({
      where: { tenantId, sessionId },
      include: { session: true },
      orderBy: { number: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.term.findFirst({
      where: { id, tenantId },
      include: { session: true, exams: true },
    });
  }

  async update(tenantId: string, id: string, data: { name?: string; number?: number; startDate?: string; endDate?: string }) {
    return this.prisma.term.update({
      where: { id },
      data: {
        name: data.name,
        number: data.number,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  // 👇 NEW: Toggle term active status
  async toggleActive(tenantId: string, id: string, isActive: boolean) {
    // If we are activating a term, first deactivate all other terms for this tenant
    if (isActive) {
      await this.prisma.term.updateMany({
        where: { tenantId },
        data: { isActive: false },
      });
    }

    // Then, update the specific term to the new active status
    return this.prisma.term.update({
      where: { id },
      data: { isActive },
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.term.delete({ where: { id, tenantId } });
  }
}