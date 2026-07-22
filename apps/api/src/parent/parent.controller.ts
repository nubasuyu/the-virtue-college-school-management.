import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { ParentService } from './parent.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';

@Controller('parents')
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Post()
  create(@Body() createParentDto: CreateParentDto, @Req() req: any) {
    const tenantId = req.user.tenantId; 
    return this.parentService.create(tenantId, createParentDto);
  }

  @Get()
  findAll(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.parentService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.parentService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateParentDto: UpdateParentDto, @Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.parentService.update(tenantId, id, updateParentDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.parentService.delete(tenantId, id);
  }
}