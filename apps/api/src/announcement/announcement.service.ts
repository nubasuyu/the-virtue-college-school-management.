import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnouncementService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, userId: string, data: any) {
    return this.prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        tenantId,
        targetAudience: data.targetAudience || 'ALL',
        isPinned: data.isPinned || false,
        author: { connect: { id: userId } }, 
      },
      include: {
        author: true,
        targetClass: true,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.announcement.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        targetClass: true,
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    // 👇 FIX: Added tenantId to where clause for security
    const announcement = await this.prisma.announcement.findUnique({
      where: { id, tenantId },
      include: { author: true, targetClass: true },
    });
    
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  async update(tenantId: string, id: string, data: any) {
    // 👇 FIX: Added tenantId to where clause for security
    // Also ensures we only update if the announcement belongs to this tenant
    const existing = await this.prisma.announcement.findUnique({
      where: { id, tenantId }
    });
    
    if (!existing) throw new NotFoundException('Announcement not found');

    return this.prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        targetAudience: data.targetAudience,
        isPinned: data.isPinned,
      },
      include: { author: true, targetClass: true },
    });
  }

  async remove(tenantId: string, id: string) {
    // 👇 FIX: Added tenantId to where clause for security
    return this.prisma.announcement.delete({ 
      where: { id, tenantId } 
    });
  }
}