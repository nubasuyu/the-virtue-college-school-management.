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
} from '@nestjs/common';
import { FeesService } from './fees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('fees')
@UseGuards(JwtAuthGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  // Create a fee structure
  @Post('structure')
  async createFeeStructure(
    @Request() req: any,
    @Body()
    body: {
      name: string;
      amount: number;
      currency?: string;
      classId: string;
      termId: string;
      description?: string;
      dueDate?: string;
    }
  ) {
    return this.feesService.createFeeStructure(req.user.tenantId, body);
  }

  // Get all fee structures for a class and term
  @Get('structure')
  async getFeeStructures(
    @Request() req: any,
    @Query('classId') classId: string,
    @Query('termId') termId: string
  ) {
    return this.feesService.getFeeStructures(
      req.user.tenantId,
      classId,
      termId
    );
  }

  // Record a payment
  @Post('payment')
  async recordPayment(
    @Request() req: any,
    @Body()
    body: {
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

  // Get all payments for a student
  @Get('payment/student/:studentId')
  async getStudentPayments(
    @Request() req: any,
    @Param('studentId') studentId: string
  ) {
    return this.feesService.getStudentPayments(req.user.tenantId, studentId);
  }

  // Calculate outstanding balance for a student in a term
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

  // Delete a fee structure
  @Delete('structure/:id')
  async deleteFeeStructure(
    @Request() req: any,
    @Param('id') id: string
  ) {
    return this.feesService.deleteFeeStructure(req.user.tenantId, id);
  }
}