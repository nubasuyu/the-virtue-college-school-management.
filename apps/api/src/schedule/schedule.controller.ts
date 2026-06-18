import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  async createSchedule(
    @Request() req: any,
    @Body()
    body: {
      classId: string;
      subjectId: string;
      teacherId: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      roomName?: string;
      termId?: string;
    }
  ) {
    return this.scheduleService.createSchedule(req.user.tenantId, body);
  }

  @Get('class/:classId')
  async getClassTimetable(
    @Request() req: any,
    @Param('classId') classId: string,
    @Query('termId') termId?: string
  ) {
    return this.scheduleService.getClassTimetable(req.user.tenantId, classId, termId);
  }

  @Get('teacher/:teacherId')
  async getTeacherTimetable(
    @Request() req: any,
    @Param('teacherId') teacherId: string,
    @Query('termId') termId?: string
  ) {
    return this.scheduleService.getTeacherTimetable(req.user.tenantId, teacherId, termId);
  }

  @Get()
  async getAllSchedules(
    @Request() req: any,
    @Query('termId') termId?: string
  ) {
    return this.scheduleService.getAllSchedules(req.user.tenantId, termId);
  }
}