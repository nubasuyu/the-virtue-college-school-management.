// apps/api/src/exam/dto/submit-answer.dto.ts

import { IsString, IsOptional } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @IsOptional()
  selectedOptionId?: string; // For MCQ questions

  @IsString()
  @IsOptional()
  submittedText?: string; // For Theory questions
}