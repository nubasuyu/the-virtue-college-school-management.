import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicSessionService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: { name: string; startDate: string; endDate: string; isActive?: boolean }) {
    // If this session is being created as active, deactivate all others first
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
      orderBy: { startDate: 'desc' }, // Sorted by date for better logic
    });
  }

  async findOne(tenantId: string, id: string) {
    const session = await this.prisma.academicSession.findFirst({
      where: { id, tenantId },
      include: { terms: true },
    });
    
    if (!session) {
      throw new NotFoundException('Academic session not found');
    }
    
    return session;
  }

  async update(tenantId: string, id: string, data: { name?: string; startDate?: string; endDate?: string; isActive?: boolean }) {
    // Verify ownership and existence first
    await this.findOne(tenantId, id);

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
    // Verify ownership and existence first
    await this.findOne(tenantId, id);
    
    return this.prisma.academicSession.delete({ where: { id, tenantId } });
  }
}