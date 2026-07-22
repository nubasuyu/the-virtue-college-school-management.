import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('promotion')
@UseGuards(JwtAuthGuard)
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Get('class/:classId')
  async getStudentsInClass(@Request() req: any, @Param('classId') classId: string) {
    return this.promotionService.getStudentsByClass(req.user.tenantId, classId);
  }

  @Post('bulk')
  async bulkPromote(
    @Request() req: any,
    @Body() body: {
      studentIds: string[];
      newClassId: string;
      sessionId: string;
      status: 'PROMOTED' | 'REPEATED' | 'GRADUATED' | 'WITHDRAWN';
    }
  ) {
    return this.promotionService.processPromotion(req.user.tenantId, body);
  }
}