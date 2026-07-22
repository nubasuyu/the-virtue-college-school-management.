import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ParentService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: CreateParentDto) {
    const { studentIds, createPortalAccount, password, ...parentData } = data;

    return this.prisma.$transaction(async (tx) => {
      let userId: string | undefined = undefined;

      // 1. Optionally create a User account for portal access
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

      // 2. Create the Parent record
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