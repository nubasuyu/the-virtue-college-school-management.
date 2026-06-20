import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';

// 👇 COPY THIS EXACT IMPORT FROM YOUR CLASS CONTROLLER 👇
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 

// 👇 ADD THIS EXACT GUARD FROM YOUR CLASS CONTROLLER 👇
@UseGuards(JwtAuthGuard)
@Controller('announcement')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.announcementService.create(req.user.tenantId, req.user.id, body);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.announcementService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.announcementService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.announcementService.update(id, body);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.announcementService.remove(req.user.tenantId, id);
  }
}