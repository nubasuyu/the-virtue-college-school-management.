import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Ideally, these should be in separate files: dto/create-student.dto.ts & dto/update-student.dto.ts
export class CreateStudentDto {
   firstName: string;
  lastName: string;
  admissionNo: string;
  dateOfBirth: string; 
  gender?: string;  // Expected format: "YYYY-MM-DD"
  // ... other fields
}

export class UpdateStudentDto {
  firstName?: string;
  lastName?: string;
  admissionNo?: string;
  dateOfBirth?: string;
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

  return this.prisma.student.create({
    data: {
      ...data, // This now safely includes 'gender'
      dateOfBirth: dob,
      tenantId,
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