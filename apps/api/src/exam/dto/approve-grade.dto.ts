// apps/api/src/exam/dto/approve-grade.dto.ts

import { IsNumber, IsString, IsEnum, IsOptional, Min } from 'class-validator';

export enum GradingStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  FLAGGED = 'FLAGGED',
}

export class ApproveGradeDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  teacherFinalScore?: number;

  @IsString()
  @IsOptional()
  teacherFinalFeedback?: string;

  @IsEnum(GradingStatus)
  @IsOptional()
  status?: GradingStatus;
}