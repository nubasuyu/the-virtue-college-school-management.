import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { AcademicSessionService } from './academic-session.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('academic-session')
@UseGuards(JwtAuthGuard)
export class AcademicSessionController {
  constructor(private readonly academicSessionService: AcademicSessionService) {}

  @Post()
  async create(@Request() req: any, @Body() body: { name: string; startDate: string; endDate: string; isActive?: boolean }) {
    return this.academicSessionService.create(req.user.tenantId, body);
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.academicSessionService.findAll(req.user.tenantId);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.academicSessionService.findOne(req.user.tenantId, id);
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: { name?: string; startDate?: string; endDate?: string; isActive?: boolean }) {
    return this.academicSessionService.update(req.user.tenantId, id, body);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.academicSessionService.remove(req.user.tenantId, id);
  }
}