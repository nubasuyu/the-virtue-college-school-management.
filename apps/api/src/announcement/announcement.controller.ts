import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('announcement')
@UseGuards(JwtAuthGuard)
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  async createAnnouncement(@Request() req: any, @Body() body: any) {
    return this.announcementService.createAnnouncement(req.user.tenantId, body);
  }

  @Get()
  async getAllAnnouncements(
    @Request() req: any,
    @Query('targetAudience') targetAudience?: string,
    @Query('classId') classId?: string
  ) {
    return this.announcementService.getAllAnnouncements(
      req.user.tenantId,
      targetAudience,
      classId
    );
  }

  @Get(':id')
  async getAnnouncement(@Request() req: any, @Param('id') id: string) {
    return this.announcementService.getAnnouncement(req.user.tenantId, id);
  }

  @Patch(':id')
  async updateAnnouncement(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.announcementService.updateAnnouncement(
      req.user.tenantId,
      id,
      body
    );
  }

  @Delete(':id')
  async deleteAnnouncement(@Request() req: any, @Param('id') id: string) {
    return this.announcementService.deleteAnnouncement(req.user.tenantId, id);
  }
}