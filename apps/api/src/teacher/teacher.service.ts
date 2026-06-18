import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) {}

  // Create a new teacher (which is actually a User with role TEACHER)
  async create(
    tenantId: string,
    data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }
  ) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        tenantId,
        email: data.email,
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'TEACHER',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  // Get all teachers for the current tenant
  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { 
        tenantId, 
        role: 'TEACHER' 
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    });
  }

  // Get a single teacher by ID (with tenant and role check)
  async findOne(tenantId: string, id: string) {
    const teacher = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!teacher || teacher.tenantId !== tenantId || teacher.role !== 'TEACHER') {
      throw new NotFoundException('Teacher not found');
    }

    // Return teacher details without the password hash
    return {
      id: teacher.id,
      email: teacher.email,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      role: teacher.role,
      isActive: teacher.isActive,
      createdAt: teacher.createdAt,
    };
  }

  // Update a teacher (with tenant check)
  async update(
    tenantId: string,
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      isActive?: boolean;
    }
  ) {
    // First check if teacher exists and belongs to this tenant
    await this.findOne(tenantId, id);

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  // Delete a teacher (with tenant check)
  async delete(tenantId: string, id: string) {
    // First check if teacher exists and belongs to this tenant
    await this.findOne(tenantId, id);

    return this.prisma.user.delete({
      where: { id },
    });
  }
}