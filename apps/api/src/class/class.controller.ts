import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ClassService } from './class.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('class')
@UseGuards(JwtAuthGuard) // This protects ALL routes in this controller
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.classService.create(req.user.tenantId, body);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.classService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.classService.findOne(req.user.tenantId, id);
  }

  @Put(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.classService.update(req.user.tenantId, id, body);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.classService.delete(req.user.tenantId, id);
  }
}