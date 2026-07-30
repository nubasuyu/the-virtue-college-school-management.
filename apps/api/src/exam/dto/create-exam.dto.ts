// apps/api/src/exam/dto/create-exam.dto.ts

import { IsString, IsInt, IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class CreateExamDto {
  @IsString()
  name: string;

  @IsString()
  assessmentType: string;

  @IsString()
  subjectId: string;

  @IsString()
  classId: string;

  @IsString()
  termId: string;

  @IsDateString()
  date: string;

  @IsInt()
  @IsOptional()
  totalMarks?: number;

  // Online exam specific fields
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @IsInt()
  @IsOptional()
  durationMins?: number;

  @IsBoolean()
  @IsOptional()
  shuffleOptions?: boolean;
}