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
    // 👇 DEBUG: Let's see exactly what the JWT guard is giving us
    console.log('🔍 REQ.USER PAYLOAD:', req.user);
    
    // 👇 FIX: Try all common property names for the user ID
    const authorId = req.user.id || req.user.sub || req.user.userId;
    
    if (!authorId) {
      throw new Error('User ID is missing from the request. Check JWT Strategy.');
    }

    return this.announcementService.create(req.user.tenantId, authorId, body);
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
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    // 👇 FIX: Pass all 3 arguments: tenantId, id, and body (data)
    return this.announcementService.update(req.user.tenantId, id, body);
  }


  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.announcementService.remove(req.user.tenantId, id);
  }
}