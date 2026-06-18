import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  // Create a new student
  async create(
    tenantId: string,
    data: {
      admissionNo: string;
      firstName: string;
      lastName: string;
      dateOfBirth: Date;
      gender: string;
      email?: string;
      parentName?: string;
      parentPhone?: string;
      parentEmail?: string;
      address?: string;
      classId?: string;
    }
  ) {
    return this.prisma.student.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  // Get all students for the current tenant
  async findAll(tenantId: string) {
    return this.prisma.student.findMany({
      where: { tenantId },
      orderBy: {
        admissionNo: 'asc',
      },
    });
  }

  // Get a single student by ID (with tenant check)
  async findOne(tenantId: string, id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this student');
    }

    return student;
  }

  // Update a student (with tenant check)
  async update(
    tenantId: string,
    id: string,
    data: {
      admissionNo?: string;
      firstName?: string;
      lastName?: string;
      dateOfBirth?: Date;
      gender?: string;
      email?: string;
      parentName?: string;
      parentPhone?: string;
      parentEmail?: string;
      address?: string;
      classId?: string;
    }
  ) {
    // First check if student exists and belongs to this tenant
    await this.findOne(tenantId, id);

    return this.prisma.student.update({
      where: { id },
      data,
    });
  }

  // Delete a student (with tenant check)
  async delete(tenantId: string, id: string) {
    // First check if student exists and belongs to this tenant
    await this.findOne(tenantId, id);

    return this.prisma.student.delete({
      where: { id },
    });
  }
}