import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('teacher')
@UseGuards(JwtAuthGuard) // This protects ALL routes in this controller
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.teacherService.create(req.user.tenantId, body);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.teacherService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.teacherService.findOne(req.user.tenantId, id);
  }

  @Put(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.teacherService.update(req.user.tenantId, id, body);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.teacherService.delete(req.user.tenantId, id);
  }
}