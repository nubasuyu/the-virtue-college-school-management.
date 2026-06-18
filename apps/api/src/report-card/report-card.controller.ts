import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ReportCardService } from './report-card.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('report-card')
@UseGuards(JwtAuthGuard)
export class ReportCardController {
  constructor(private readonly reportCardService: ReportCardService) {}

  // Generate a full report card for a student for a specific term
  @Get('student/:studentId/term/:termId')
  async generateReportCard(
    @Request() req: any,
    @Param('studentId') studentId: string,
    @Param('termId') termId: string
  ) {
    return this.reportCardService.generateReportCard(
      req.user.tenantId,
      studentId,
      termId
    );
  }
}