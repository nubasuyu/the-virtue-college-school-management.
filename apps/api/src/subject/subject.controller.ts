import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subject')
@UseGuards(JwtAuthGuard) // This protects ALL routes in this controller
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.subjectService.create(req.user.tenantId, body);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.subjectService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.subjectService.findOne(req.user.tenantId, id);
  }

  @Put(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.subjectService.update(req.user.tenantId, id, body);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.subjectService.delete(req.user.tenantId, id);
  }
}