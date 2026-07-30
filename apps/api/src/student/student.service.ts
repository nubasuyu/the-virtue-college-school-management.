import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs'; // ✅ Added bcrypt import (use 'bcrypt' if that's what you have installed)

// Ideally, these should be in separate files: dto/create-student.dto.ts & dto/update-student.dto.ts
export class CreateStudentDto {
  firstName: string;
  lastName: string;
  admissionNo: string;
  dateOfBirth: string; 
  gender?: string;
  email?: string; // Added email in case it's passed from the frontend
  // ... other fields
}

export class UpdateStudentDto {
  firstName?: string;
  lastName?: string;
  admissionNo?: string;
  dateOfBirth?: string;
  email?: string;
  // ... other optional fields
}

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: CreateStudentDto) {
    const dob = new Date(data.dateOfBirth);
    if (isNaN(dob.getTime())) {
      throw new BadRequestException('Invalid date format for dateOfBirth');
    }

    // ✅ Generate a default password hash for the new student
    const defaultPassword = 'student123'; 
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    return this.prisma.student.create({
      data: {
        ...data, 
        dateOfBirth: dob,
        tenantId,
        passwordHash, // ✅ Added the required passwordHash field
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.student.findMany({
      where: { tenantId },
      orderBy: { admissionNo: 'asc' },
    });
  }

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

  async update(tenantId: string, id: string, data: UpdateStudentDto) {
    // 1. Verify existence and tenant ownership (throws if invalid)
    await this.findOne(tenantId, id);

    // 2. Prepare update data safely
    const updateData: any = { ...data };

    // 3. Handle date conversion safely if provided
    if (updateData.dateOfBirth) {
      const dob = new Date(updateData.dateOfBirth);
      if (isNaN(dob.getTime())) {
        throw new BadRequestException('Invalid date format for dateOfBirth');
      }
      updateData.dateOfBirth = dob;
    }

    // 4. Explicitly prevent tenantId from being overwritten
    delete updateData.tenantId;

    return this.prisma.student.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(tenantId: string, id: string) {
    // Verify existence and tenant ownership first
    await this.findOne(tenantId, id);

    return this.prisma.student.delete({
      where: { id },
    });
  }
}