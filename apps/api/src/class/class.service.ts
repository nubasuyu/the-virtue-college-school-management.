import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassService {
  constructor(private prisma: PrismaService) {}

  // Create a new class
  async create(
    tenantId: string,
    data: {
      name: string;
      section: string;
    }
  ) {
    return this.prisma.class.create({
      data: {
        ...data,
        tenantId,
      },
      include: {
        students: true,
      },
    });
  }

  // Get all classes for the current tenant
  async findAll(tenantId: string) {
    return this.prisma.class.findMany({
      where: { tenantId },
      include: {
        students: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // Get a single class by ID (with tenant check)
  async findOne(tenantId: string, id: string) {
    const classRecord = await this.prisma.class.findUnique({
      where: { id },
      include: {
        students: true,
      },
    });

    if (!classRecord) {
      throw new NotFoundException('Class not found');
    }

    if (classRecord.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this class');
    }

    return classRecord;
  }

  // Update a class (with tenant check)
  async update(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      section?: string;
    }
  ) {
    // First check if class exists and belongs to this tenant
    await this.findOne(tenantId, id);

    return this.prisma.class.update({
      where: { id },
      data,
      include: {
        students: true,
      },
    });
  }

  // Delete a class (with tenant check)
  async delete(tenantId: string, id: string) {
    // First check if class exists and belongs to this tenant
    await this.findOne(tenantId, id);

    return this.prisma.class.delete({
      where: { id },
    });
  }
}