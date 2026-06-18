import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { StudentService } from './student.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('student')
@UseGuards(JwtAuthGuard) // This protects ALL routes in this controller
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.studentService.create(req.user.tenantId, body);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.studentService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.studentService.findOne(req.user.tenantId, id);
  }

  @Put(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.studentService.update(req.user.tenantId, id, body);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.studentService.delete(req.user.tenantId, id);
  }
}