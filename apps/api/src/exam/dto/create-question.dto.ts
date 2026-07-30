// apps/api/src/exam/dto/create-question.dto.ts

import { IsString, IsEnum, IsNumber, IsArray, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum QuestionType {
  MCQ = 'MCQ',
  THEORY = 'THEORY',
}

export class CreateOptionDto {
  @IsString()
  optionText: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class CreateRubricDto {
  @IsString()
  modelAnswer: string;

  @IsArray()
  gradingCriteria: any[]; // JSON array of grading criteria
}

export class CreateQuestionDto {
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsString()
  questionText: string;

  @IsNumber()
  maxPoints: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  @IsOptional()
  options?: CreateOptionDto[]; // Only for MCQ questions

  @ValidateNested()
  @Type(() => CreateRubricDto)
  @IsOptional()
  rubric?: CreateRubricDto; // Only for Theory questions
}