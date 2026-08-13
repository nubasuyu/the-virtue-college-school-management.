import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { StudentService } from './student.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('student') // 👈 REVERTED BACK TO SINGULAR TO MATCH FRONTEND
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly prisma: PrismaService
  ) {}

  // 👇 1. SPECIFIC ROUTES MUST ALWAYS BE AT THE TOP 👇
  
  @Get('my-children')
  @Roles('PARENT') 
  async getMyChildren(@Request() req: any) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId: req.user.userId },
      include: { 
        // 👇 UPDATED: Use the new studentParents junction table
        studentParents: { 
          include: { student: true } 
        } 
      },
    });
    
    if (!parent) return []; 
    
    // Map to a flat 'student' array for backward compatibility with frontend
    return parent.studentParents.map(sp => sp.student);
  }

  @Get()
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER')
  findAll(@Request() req: any) {
    return this.studentService.findAll(req.user.tenantId);
  }

  @Post()
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  create(@Request() req: any, @Body() body: any) {
    return this.studentService.create(req.user.tenantId, body);
  }

  // 👇 2. DYNAMIC ROUTES (WITH :id) MUST ALWAYS BE AT THE BOTTOM 👇
    @Post('bulk-upload')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  async bulkUpload(@Request() req: any, @Body() body: { classId: string; students: any[] }) {
    return this.studentService.bulkCreate(req.user.tenantId, body.classId, body.students);
  }

  @Get(':id')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.studentService.findOne(req.user.tenantId, id);
  }

  @Put(':id')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.studentService.update(req.user.tenantId, id, body);
  }

  @Delete(':id')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.studentService.delete(req.user.tenantId, id);
  }
}