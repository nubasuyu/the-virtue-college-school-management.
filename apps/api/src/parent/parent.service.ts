import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';

@Injectable()
export class ParentService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async create(tenantId: string, data: any) {
    // 👇 Extract 'relation' so it doesn't get passed to the Parent model
    const { studentIds, createPortalAccount, password, relation, ...parentData } = data;

    const newParent = await this.prisma.$transaction(async (tx) => {
      let userId: string | undefined = undefined;

      if (createPortalAccount && parentData.email && password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await tx.user.create({
          data: {
            tenantId,
            email: parentData.email.toLowerCase(),
            passwordHash: hashedPassword,
            firstName: parentData.firstName,
            lastName: parentData.lastName,
            role: 'PARENT',
            isActive: true,
          },
        });
        userId = newUser.id;
      } else if (createPortalAccount && !parentData.email) {
        throw new BadRequestException('Email is required to create a portal account');
      }

      const createdParent = await tx.parent.create({
        data: {
          ...parentData, // 'relation' is safely excluded from here now
          tenantId,
          userId,
          // 👇 Pass 'relation' to the junction table instead
          studentParents: studentIds?.length 
            ? {
                create: studentIds.map((id: string) => ({
                  studentId: id,
                  tenantId,
                  isPrimary: true,
                  relation: relation || 'Parent', 
                })),
              } 
            : undefined,
        },
        include: { 
          studentParents: { include: { student: true } }, 
          user: { select: { id: true, email: true, isActive: true } }
        },
      });

      return createdParent;
    });

    if (createPortalAccount && newParent.user?.email && password) {
      this.emailService.sendParentWelcomeEmail(
        newParent.user.email,
        `${newParent.firstName} ${newParent.lastName}`,
        password
      ).catch((err) => {
        console.error('Failed to send welcome email:', err);
      });
    }

    return {
      ...newParent,
      students: newParent.studentParents.map(sp => sp.student)
    };
  }

  async findAll(tenantId: string) {
    const parents = await this.prisma.parent.findMany({
      where: { tenantId },
      include: { 
        studentParents: { include: { student: true } },
        user: { select: { id: true, email: true, isActive: true } }
      },
      orderBy: { lastName: 'asc' },
    });

    return parents.map(parent => ({
      ...parent,
      students: parent.studentParents.map(sp => sp.student)
    }));
  }

  async findOne(tenantId: string, id: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { id },
      include: { 
        studentParents: { include: { student: true } },
        user: { select: { id: true, email: true, isActive: true } }
      },
    });

    if (!parent) throw new NotFoundException('Parent not found');
    if (parent.tenantId !== tenantId) throw new ForbiddenException('Access denied');

    return {
      ...parent,
      students: parent.studentParents.map(sp => sp.student)
    };
  }

  async findOneByUserId(userId: string, tenantId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: { 
        studentParents: { include: { student: true } },
        user: { select: { id: true, email: true, isActive: true } }
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found for this user');
    }

    if (parent.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return {
      ...parent,
      students: parent.studentParents.map(sp => sp.student)
    };
  }

  async getMyChildren(userId: string, tenantId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId, tenantId },
      include: { 
        studentParents: { include: { student: true } }
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found');
    }

    return parent.studentParents.map(sp => sp.student);
  }

  async update(tenantId: string, id: string, data: any) {
    await this.findOne(tenantId, id);

    // 👇 Extract 'relation' here too for consistency
    const { studentIds, password, createPortalAccount, relation, ...updateData } = data;

    if (studentIds !== undefined) {
      await this.prisma.studentParent.deleteMany({
        where: { parentId: id }
      });

      if (studentIds.length > 0) {
        await this.prisma.studentParent.createMany({
          data: studentIds.map((studentId: string) => ({
            studentId,
            parentId: id,
            tenantId,
            isPrimary: true,
            relation: relation || 'Parent', // 👇 Pass relation to junction table
          }))
        });
      }
    }

    const updatedParent = await this.prisma.parent.update({
      where: { id },
      data: updateData,
      include: { 
        studentParents: { include: { student: true } },
        user: { select: { id: true, email: true, isActive: true } }
      },
    });

    return {
      ...updatedParent,
      students: updatedParent.studentParents.map(sp => sp.student)
    };
  }

  async delete(tenantId: string, id: string) {
    const parent = await this.findOne(tenantId, id);

    return this.prisma.$transaction(async (tx) => {
      if (parent.userId) {
        await tx.user.delete({ where: { id: parent.userId } });
      }
      return tx.parent.delete({ where: { id } });
    });
  }
}