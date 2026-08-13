import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Req,
  ForbiddenException
} from '@nestjs/common';
import { FeesService } from './fees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('fees')
@UseGuards(JwtAuthGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  // ==========================================
  // FEE STRUCTURE MANAGEMENT
  // ==========================================

  @Post('structure')
  async createFeeStructure(
    @Request() req: any,
    @Body() body: {
      name: string;
      amount: number;
      currency?: string;
      classId?: string;
      termId?: string;
      description?: string;
      dueDate?: string;
      isOptional?: boolean;
      category?: string;
    }
  ) {
    return this.feesService.createFeeStructure(req.user.tenantId, body);
  }

  @Get('structure')
  async getFeeStructures(
    @Request() req: any,
    @Query('classId') classId?: string,
    @Query('termId') termId?: string
  ) {
    return this.feesService.getFeeStructures(
      req.user.tenantId,
      classId,
      termId
    );
  }

  @Delete('structure/:id')
  async deleteFeeStructure(
    @Request() req: any,
    @Param('id') id: string
  ) {
    return this.feesService.deleteFeeStructure(req.user.tenantId, id);
  }

  // ==========================================
  // PAYMENT MANAGEMENT
  // ==========================================

  @Post('payment')
  async recordPayment(
    @Request() req: any,
    @Body() body: {
      studentId: string;
      feeStructureId?: string;
      amount: number;
      currency?: string;
      paymentMethod: string;
      reference?: string;
      remarks?: string;
    }
  ) {
    return this.feesService.recordPayment(req.user.tenantId, body);
  }

  @Get('payment/student/:studentId')
  async getStudentPayments(
    @Request() req: any,
    @Param('studentId') studentId: string
  ) {
    return this.feesService.getStudentPayments(req.user.tenantId, studentId);
  }

  @Get('payment')
  getAllPayments(@Req() req: any) {
    return this.feesService.getAllPayments(req.user.tenantId);
  }

  // ==========================================
  // STUDENT FEE BALANCE & BREAKDOWN
  // ==========================================

  @Get('balance/student/:studentId/term/:termId')
  async calculateBalance(
    @Request() req: any,
    @Param('studentId') studentId: string,
    @Param('termId') termId: string
  ) {
    return this.feesService.calculateBalance(
      req.user.tenantId,
      studentId,
      termId
    );
  }

  // 👇 NEW: Get personalized fee breakdown for a specific student
  @Get('student/:studentId/breakdown')
  async getStudentFeeBreakdown(@Req() req: any, @Param('studentId') studentId: string) {
    return this.feesService.getStudentFeeBreakdown(req.user.tenantId, studentId);
  }

  // 👇 NEW: Toggle an optional fee (like Hostel/Bus) for a specific student
  @Post('student/:studentId/fee/:feeStructureId/toggle')
  async toggleStudentFee(
    @Req() req: any, 
    @Param('studentId') studentId: string, 
    @Param('feeStructureId') feeStructureId: string,
    @Body() body: { isActive: boolean }
  ) {
    return this.feesService.toggleStudentFee(req.user.tenantId, studentId, feeStructureId, body.isActive);
  }

  // ==========================================
  // PARENT PORTAL SUMMARY
  // ==========================================

  @Get('student/:studentId/summary')
  async getStudentFeeSummary(@Req() req: any, @Param('studentId') studentId: string) {
    // Security check: Ensure the user is a Parent or Admin
    if (req.user.role !== 'PARENT' && req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'SCHOOL_ADMIN' && req.user.role !== 'ACCOUNTANT') {
      throw new ForbiddenException('Access denied: Parents, Accountants, and Admins only.');
    }
    return this.feesService.getStudentFeeSummary(req.user.tenantId, studentId);
  }
}