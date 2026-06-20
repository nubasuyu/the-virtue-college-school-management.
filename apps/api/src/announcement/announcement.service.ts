import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnouncementService {
  constructor(private prisma: PrismaService) {}

  // 👇 UPDATED TO ACCEPT userId AND CONNECT IT AS THE AUTHOR 👇
  async create(tenantId: string, userId: string, data: any) {
    return this.prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        tenantId,
        targetAudience: data.targetAudience || 'ALL',
        isPinned: data.isPinned || false,
        // 👇 THIS FIXES THE "AUTHOR IS MISSING" ERROR 👇
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
      orderBy: { createdAt: 'desc' }, // Show newest announcements first
      include: {
        author: true, // Include the author's name
        targetClass: true,
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: { author: true, targetClass: true },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  async update(id: string, data: any) {
    return this.prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
      },
      include: { author: true, targetClass: true },
    });
  }

  async remove(tenantId: string, id: string) {
    return this.prisma.announcement.delete({ where: { id } });
  }
}