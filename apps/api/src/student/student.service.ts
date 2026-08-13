import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

export class CreateStudentDto {
  firstName: string;
  lastName: string;
  admissionNo: string;
  dateOfBirth: string; 
  gender?: string;
  email?: string;
  parentName?: string;
  parentPhone?: string;
  currentClassId?: string;
  photoUrl?: string;
  [key: string]: any;
}

export class UpdateStudentDto {
  firstName?: string;
  lastName?: string;
  admissionNo?: string;
  dateOfBirth?: string;
  email?: string;
  parentName?: string;
  parentPhone?: string;
  currentClassId?: string;
  photoUrl?: string;
  [key: string]: any;
}

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: CreateStudentDto) {
    const dob = new Date(data.dateOfBirth);
    if (isNaN(dob.getTime())) {
      throw new BadRequestException('Invalid date format for dateOfBirth');
    }

    const defaultPassword = 'student123'; 
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    try {
      return await this.prisma.student.create({
        data: {
          ...data,
          dateOfBirth: dob,
          tenantId,
          passwordHash,
        } as any,
      });
    } catch (error: any) {
      // 👇 CATCH UNIQUE CONSTRAINT ERRORS (P2002)
      if (error.code === 'P2002') {
        throw new ConflictException('Admission Number already exists. Please use a unique admission number.');
      }
      // Re-throw other errors
      throw error;
    }
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
    await this.findOne(tenantId, id);

    const updateData: any = { ...data };

    if (updateData.dateOfBirth) {
      const dob = new Date(updateData.dateOfBirth);
      if (isNaN(dob.getTime())) {
        throw new BadRequestException('Invalid date format for dateOfBirth');
      }
      updateData.dateOfBirth = dob;
    }

    delete updateData.tenantId;

    try {
      return await this.prisma.student.update({
        where: { id },
        data: updateData,
      });
    } catch (error: any) {
      // 👇 CATCH UNIQUE CONSTRAINT ERRORS (P2002) DURING UPDATE TOO
      if (error.code === 'P2002') {
        throw new ConflictException('Admission Number already exists. Please use a unique admission number.');
      }
      throw error;
    }
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.student.delete({
      where: { id },
    });
  }

  // ==========================================
  // BULK UPLOAD LOGIC
  // ==========================================
  async bulkCreate(tenantId: string, classId: string, studentsData: any[]) {
    const results = { success: 0, failed: 0, errors: [] as any[] };

    for (const data of studentsData) {
      try {
        // 1. Prepare student payload (Exclude parent fields!)
        const studentPayload = {
          firstName: data.firstName,
          lastName: data.lastName,
          admissionNo: data.admissionNo,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          currentClassId: classId, // Assign to the selected class
          // Add any other student-specific fields here if needed
        };

        // 2. Create the student
        const student = await this.create(tenantId, studentPayload);

        // 3. Create Parent and Link ONLY if parent data is provided
        if (data.parentFirstName && data.parentPhone) {
          const parent = await this.prisma.parent.create({
            data: {
              tenantId,
              firstName: data.parentFirstName,
              lastName: data.parentLastName || '',
              phone: data.parentPhone,
              email: data.parentEmail || null,
            }
          });

          // Link Student and Parent via the junction table
          await this.prisma.studentParent.create({
            data: {
              tenantId,
              studentId: student.id,
              parentId: parent.id,
              relation: data.parentRelation || 'Parent',
              isPrimary: true,
            }
          });
        }

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          admissionNo: data.admissionNo,
          name: `${data.firstName} ${data.lastName}`,
          message: error.message || 'Unknown error',
        });
      }
    }

    return results;
  }
}