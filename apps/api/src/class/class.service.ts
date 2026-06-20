import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassService {
  constructor(private prisma: PrismaService) {}

  // Create a new class
  async create(tenantId: string, data: any) {
    return this.prisma.class.create({
      data: {
        name: data.name,
        section: data.section,
        tenantId,
        // 👇 JUST USE THE ID DIRECTLY 👇
        classTeacherId: data.classTeacherId || null,
      },
    });
  }

  // Get all classes for the current tenant
  async findAll(tenantId: string) {
    const classes = await this.prisma.class.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    // 👇 MANUALLY FETCH TEACHER NAMES 👇
    const classesWithTeachers = await Promise.all(
      classes.map(async (cls) => {
        if (cls.classTeacherId) {
          const teacher = await this.prisma.user.findUnique({
            where: { id: cls.classTeacherId },
            select: { firstName: true, lastName: true },
          });
          return { ...cls, classTeacher: teacher };
        }
        return { ...cls, classTeacher: null };
      })
    );

    return classesWithTeachers;
  }

  // Get a single class by ID
  async findOne(tenantId: string, id: string) {
    const cls = await this.prisma.class.findUnique({
      where: { id },
    });

    if (!cls) throw new NotFoundException('Class not found');
    if (cls.tenantId !== tenantId) throw new ForbiddenException('Access denied');

    return cls;
  }

  // Update a class
  async update(tenantId: string, id: string, data: any) {
    await this.findOne(tenantId, id); // Check access

    return this.prisma.class.update({
      where: { id },
      data: {
        name: data.name,
        section: data.section,
        // 👇 JUST USE THE ID DIRECTLY 👇
        classTeacherId: data.classTeacherId || null,
      },
    });
  }

  // Delete a class
  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id); // Check access
    return this.prisma.class.delete({ where: { id } });
  }
}