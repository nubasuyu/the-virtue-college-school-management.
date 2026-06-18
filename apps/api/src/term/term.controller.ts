import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { TermService } from './term.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('term')
@UseGuards(JwtAuthGuard)
export class TermController {
  constructor(private readonly termService: TermService) {}

  @Post()
  async create(@Request() req: any, @Body() body: { sessionId: string; name: string; number: number; startDate: string; endDate: string }) {
    return this.termService.create(req.user.tenantId, body);
  }

  @Get()
  async findAll(@Request() req: any, @Query('sessionId') sessionId?: string) {
    return this.termService.findAll(req.user.tenantId, sessionId);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.termService.findOne(req.user.tenantId, id);
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: { name?: string; number?: number; startDate?: string; endDate?: string }) {
    return this.termService.update(req.user.tenantId, id, body);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.termService.remove(req.user.tenantId, id);
  }
}