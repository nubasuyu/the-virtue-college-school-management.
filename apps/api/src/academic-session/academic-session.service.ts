import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicSessionService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: { name: string; startDate: string; endDate: string; isActive?: boolean }) {
    // If this session is active, deactivate all others first
    if (data.isActive) {
      await this.prisma.academicSession.updateMany({
        where: { tenantId, isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.academicSession.create({
      data: {
        tenantId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive || false,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.academicSession.findMany({
      where: { tenantId },
      include: { terms: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.academicSession.findFirst({
      where: { id, tenantId },
      include: { terms: true },
    });
  }

  async update(tenantId: string, id: string, data: { name?: string; startDate?: string; endDate?: string; isActive?: boolean }) {
    if (data.isActive) {
      await this.prisma.academicSession.updateMany({
        where: { tenantId, isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }

    return this.prisma.academicSession.update({
      where: { id },
      data: {
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        isActive: data.isActive,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.academicSession.delete({ where: { id, tenantId } });
  }
}