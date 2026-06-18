import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnouncementService {
  constructor(private prisma: PrismaService) {}

  async createAnnouncement(
    tenantId: string,
    data: {
      title: string;
      content: string;
      authorId: string;
      targetAudience?: string;
      targetClassId?: string;
      isPinned?: boolean;
    }
  ) {
    return this.prisma.announcement.create({
      data: {
        tenantId,
        title: data.title,
        content: data.content,
        authorId: data.authorId,
        targetAudience: data.targetAudience || 'ALL',
        targetClassId: data.targetClassId,
        isPinned: data.isPinned || false,
      },
      include: {
        author: true,
        targetClass: true,
      },
    });
  }

  async getAllAnnouncements(
    tenantId: string,
    targetAudience?: string,
    classId?: string
  ) {
    const where: any = { tenantId };

    if (targetAudience && targetAudience !== 'ALL') {
      where.OR = [
        { targetAudience: 'ALL' },
        { targetAudience: targetAudience },
      ];
      if (classId) {
        where.OR.push({ targetClassId: classId });
      }
    }

    return this.prisma.announcement.findMany({
      where,
      include: {
        author: true,
        targetClass: true,
      },
      orderBy: [
        { isPinned: 'desc' }, 
        { createdAt: 'desc' }, 
      ],
    });
  }

  async getAnnouncement(tenantId: string, id: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, tenantId },
      include: { author: true, targetClass: true },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  async updateAnnouncement(
    tenantId: string,
    id: string,
    data: {
      title?: string;
      content?: string;
      targetAudience?: string;
      targetClassId?: string;
      isPinned?: boolean;
    }
  ) {
    return this.prisma.announcement.update({
      where: { id, tenantId },
      data,
      include: { author: true, targetClass: true },
    });
  }

  async deleteAnnouncement(tenantId: string, id: string) {
    return this.prisma.announcement.delete({
      where: { id, tenantId },
    });
  }
}