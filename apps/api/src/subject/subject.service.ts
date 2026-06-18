import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubjectService {
  constructor(private prisma: PrismaService) {}

  // Create a new subject
  async create(
    tenantId: string,
    data: {
      name: string;
      code: string;
      description?: string;
    }
  ) {
    return this.prisma.subject.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  // Get all subjects for the current tenant
  async findAll(tenantId: string) {
    return this.prisma.subject.findMany({
      where: { tenantId },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // Get a single subject by ID (with tenant check)
  async findOne(tenantId: string, id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject || subject.tenantId !== tenantId) {
      throw new NotFoundException('Subject not found');
    }

    return subject;
  }

  // Update a subject (with tenant check)
  async update(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      code?: string;
      description?: string;
    }
  ) {
    // First check if subject exists and belongs to this tenant
    await this.findOne(tenantId, id);

    return this.prisma.subject.update({
      where: { id },
      data,
    });
  }

  // Delete a subject (with tenant check)
  async delete(tenantId: string, id: string) {
    // First check if subject exists and belongs to this tenant
    await this.findOne(tenantId, id);

    return this.prisma.subject.delete({
      where: { id },
    });
  }
}