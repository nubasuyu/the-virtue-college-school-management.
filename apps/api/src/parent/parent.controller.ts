import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ParentService } from './parent.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard'; // 👈 Import RolesGuard
import { Roles } from '../auth/decorators/roles.decorator'; // 👈 Import Roles decorator

@Controller('parents')
@UseGuards(JwtAuthGuard, RolesGuard) // 👈 Apply both guards to the whole controller
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  // Only SCHOOL_ADMIN or SUPER_ADMIN can see ALL parents
  @Get()
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN') 
  findAll(@Req() req: any) {
    return this.parentService.findAll(req.user.tenantId);
  }

  // A parent can view their own profile
  @Get('me')
  @Roles('PARENT', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  async getMyProfile(@Req() req: any) {
    // Find the parent record linked to the logged-in user's ID
    const parent = await this.parentService.findOneByUserId(req.user.userId, req.user.tenantId);
    return parent;
  }

  @Get(':id')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.parentService.findOne(req.user.tenantId, id);
  }

  @Post()
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  create(@Body() createParentDto: CreateParentDto, @Req() req: any) {
    return this.parentService.create(req.user.tenantId, createParentDto);
  }

  @Patch(':id')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body() updateParentDto: UpdateParentDto, @Req() req: any) {
    return this.parentService.update(req.user.tenantId, id, updateParentDto);
  }

  @Delete(':id')
  @Roles('SCHOOL_ADMIN', 'SUPER_ADMIN')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.parentService.delete(req.user.tenantId, id);
  }
}