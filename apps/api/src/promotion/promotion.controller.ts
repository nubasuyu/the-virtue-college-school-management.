import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('promotion')
@UseGuards(JwtAuthGuard)
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  // Promote a single student
  @Post('student')
  async promoteStudent(
    @Request() req: any,
    @Body()
    body: {
      studentId: string;
      newClassId: string;
      sessionId: string;
    }
  ) {
    return this.promotionService.promoteStudent(
      req.user.tenantId,
      body.studentId,
      body.newClassId,
      body.sessionId
    );
  }

  // Bulk promote all students in a class
  @Post('bulk')
  async bulkPromoteClass(
    @Request() req: any,
    @Body()
    body: {
      fromClassId: string;
      toClassId: string;
      sessionId: string;
    }
  ) {
    return this.promotionService.bulkPromoteClass(
      req.user.tenantId,
      body.fromClassId,
      body.toClassId,
      body.sessionId
    );
  }

  // Get promotion history for a student
  @Get('student/:studentId')
  async getStudentPromotionHistory(
    @Request() req: any,
    @Param('studentId') studentId: string
  ) {
    return this.promotionService.getStudentPromotionHistory(
      req.user.tenantId,
      studentId
    );
  }

  // Get all promotions for a session
  @Get('session/:sessionId')
  async getSessionPromotions(
    @Request() req: any,
    @Param('sessionId') sessionId: string
  ) {
    return this.promotionService.getSessionPromotions(
      req.user.tenantId,
      sessionId
    );
  }
}