import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';

@Injectable()
export class ParentService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService // 👈 Add this line
  ) {}

    async create(tenantId: string, data: CreateParentDto) {
    const { studentIds, createPortalAccount, password, ...parentData } = data;

    // 1. Create the records in the database
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

      return tx.parent.create({
        data: {
          ...parentData,
          tenantId,
          userId,
          students: studentIds?.length 
            ? { connect: studentIds.map(id => ({ id })) } 
            : undefined,
        },
        include: { 
          students: true, 
          user: { select: { id: true, email: true, isActive: true } }
        },
      });
    });

    // 2. If a portal account was created, send the welcome email!
    if (createPortalAccount && newParent.user?.email && password) {
      // We do this outside the transaction so it doesn't block the API response
      this.emailService.sendParentWelcomeEmail(
        newParent.user.email,
        `${newParent.firstName} ${newParent.lastName}`,
        password // In a real app, you might want to send a password reset link instead of the plain password
      ).catch((err) => {
        // Log the error but don't crash the API if the email fails
        console.error('Failed to send welcome email:', err);
      });
    }

    return newParent;
  }
  async findAll(tenantId: string) {
    return this.prisma.parent.findMany({
      where: { tenantId },
      include: { 
        students: true,
        user: { select: { id: true, email: true, isActive: true } }
      },
      orderBy: { lastName: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { id },
      include: { 
        students: true,
        user: { select: { id: true, email: true, isActive: true } }
      },
    });

    if (!parent) throw new NotFoundException('Parent not found');
    if (parent.tenantId !== tenantId) throw new ForbiddenException('Access denied');

    return parent;
  }

    // Add this new method to your ParentService
  async findOneByUserId(userId: string, tenantId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: { 
        students: true,
        user: { select: { id: true, email: true, isActive: true } }
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent profile not found for this user');
    }

    if (parent.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return parent;
  }

  async update(tenantId: string, id: string, data: UpdateParentDto) {
    await this.findOne(tenantId, id);

    const { studentIds, password, createPortalAccount, ...updateData } = data;
    const prismaData: any = { ...updateData };

    if (studentIds !== undefined) {
      prismaData.students = {
        set: studentIds.map(studentId => ({ id: studentId })),
      };
    }

    return this.prisma.parent.update({
      where: { id },
      data: prismaData,
      include: { 
        students: true,
        user: { select: { id: true, email: true, isActive: true } }
      },
    });
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