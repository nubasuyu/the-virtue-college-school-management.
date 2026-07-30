// apps/api/src/exam/bulk-upload.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';
import { QuestionType } from '@prisma/client';

@Injectable()
export class BulkUploadService {
  constructor(private prisma: PrismaService) {}

  async parseFile(file: Express.Multer.File): Promise<any[]> {
    const fileName = file.originalname.toLowerCase();
    
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
      return this.parseExcel(file.buffer);
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      return this.parseWord(file.buffer);
    } else {
      throw new BadRequestException('Only .xlsx, .xls, .csv, and .docx files are supported');
    }
  }

  private async parseExcel(buffer: Buffer): Promise<any[]> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const questions: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as any;
      const rowNum = i + 2;

      if (!row.Question || !row.Type) continue;

      const type = String(row.Type).toUpperCase().trim();
      const questionText = String(row.Question).trim();
      const maxPoints = Number(row.MaxPoints) || 0;

      if (maxPoints <= 0) {
        throw new BadRequestException(`Row ${rowNum}: MaxPoints must be greater than 0`);
      }

      if (type === 'MCQ') {
        const options = [];
        const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
        const correctLetter = String(row.CorrectOption || '').toUpperCase().trim();

        for (const letter of optionLetters) {
          const optionText = row[`Option${letter}`];
          if (optionText && String(optionText).trim()) {
            options.push({
              optionText: String(optionText).trim(),
              isCorrect: letter === correctLetter,
            });
          }
        }

        if (options.length < 2) {
          throw new BadRequestException(`Row ${rowNum}: MCQ must have at least 2 options`);
        }
        if (!correctLetter || !options.find((o, idx) => optionLetters[idx] === correctLetter && o.isCorrect)) {
          throw new BadRequestException(`Row ${rowNum}: CorrectOption must match one of the provided options (A, B, C, D, etc.)`);
        }

        questions.push({ type: QuestionType.MCQ, questionText, maxPoints, options });
      } else if (type === 'THEORY') {
        const modelAnswer = row.ModelAnswer ? String(row.ModelAnswer).trim() : '';
        const criteriaRaw = row.Criteria ? String(row.Criteria).trim() : '';

        if (!modelAnswer) {
          throw new BadRequestException(`Row ${rowNum}: Theory question must have a ModelAnswer`);
        }

        const gradingCriteria = this.parseCriteria(criteriaRaw, rowNum);

        questions.push({
          type: QuestionType.THEORY,
          questionText,
          maxPoints,
          rubric: { modelAnswer, gradingCriteria },
        });
      } else {
        throw new BadRequestException(`Row ${rowNum}: Type must be either MCQ or THEORY`);
      }
    }

    if (questions.length === 0) {
      throw new BadRequestException('No valid questions found in the file');
    }

    return questions;
  }

  private async parseWord(buffer: Buffer): Promise<any[]> {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l);

    const questions: any[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const qMatch = line.match(/^Q\d+[\.\)]\s*\[(MCQ|THEORY)\]\s*(.+?)\s*\((\d+)\s*points?\)/i);
      
      if (!qMatch) {
        i++;
        continue;
      }

      const type = qMatch[1].toUpperCase();
      const questionText = qMatch[2].trim();
      const maxPoints = parseInt(qMatch[3]);

      if (type === 'MCQ') {
        const options: any[] = [];
        let correctFound = false;
        i++;

        while (i < lines.length) {
          const optLine = lines[i];
          const optMatch = optLine.match(/^([A-F])\)\s*(.+?)(\*)?$/i);
          
          if (!optMatch) break;
          
          const isCorrect = optMatch[3] === '*';
          if (isCorrect) correctFound = true;
          
          options.push({ optionText: optMatch[2].trim(), isCorrect });
          i++;
        }

        if (options.length < 2) {
          throw new BadRequestException(`Question "${questionText}": MCQ must have at least 2 options. Mark correct option with *`);
        }
        if (!correctFound) {
          throw new BadRequestException(`Question "${questionText}": No correct option marked. Add * after the correct option (e.g., "B) 4*")`);
        }

        questions.push({ type: QuestionType.MCQ, questionText, maxPoints, options });
      } else if (type === 'THEORY') {
        i++;
        let modelAnswer = '';
        const criteriaLines: string[] = [];
        let inCriteria = false;

        while (i < lines.length) {
          const nextLine = lines[i];
          if (nextLine.match(/^Q\d+[\.\)]/)) break;

          if (nextLine.toLowerCase().startsWith('model answer:')) {
            modelAnswer = nextLine.substring('model answer:'.length).trim();
            i++;
            while (i < lines.length && !lines[i].toLowerCase().startsWith('criteria:') && !lines[i].match(/^Q\d+[\.\)]/)) {
              modelAnswer += ' ' + lines[i];
              i++;
            }
          } else if (nextLine.toLowerCase().startsWith('criteria:')) {
            inCriteria = true;
            i++;
          } else if (inCriteria && nextLine.startsWith('-')) {
            criteriaLines.push(nextLine.substring(1).trim());
            i++;
          } else {
            i++;
          }
        }

        if (!modelAnswer) {
          throw new BadRequestException(`Question "${questionText}": Theory question must have a Model Answer`);
        }

        const gradingCriteria = criteriaLines.map((c) => {
          const match = c.match(/(.+?)\s*[\(:]\s*(\d+)\s*(?:pts?|points?|\))?\s*$/i);
          if (!match) {
            throw new BadRequestException(`Question "${questionText}": Invalid criteria format: "${c}". Use "Concept (3 pts)"`);
          }
          return { concept: match[1].trim(), points: parseInt(match[2]) };
        });

        questions.push({
          type: QuestionType.THEORY,
          questionText,
          maxPoints,
          rubric: { modelAnswer, gradingCriteria },
        });
      }
    }

    if (questions.length === 0) {
      throw new BadRequestException('No valid questions found in the Word document. Please follow the template format exactly.');
    }

    return questions;
  }

  private parseCriteria(raw: string, rowNum: number): any[] {
    if (!raw) return [];
    const criteria: any[] = [];
    const parts = raw.split(/[;\n]/).map((p) => p.trim()).filter((p) => p);

    for (const part of parts) {
      const match = part.match(/(.+?)\s*[\(:]\s*(\d+)\s*(?:pts?|points?|\))?\s*$/i);
      if (!match) {
        throw new BadRequestException(`Row ${rowNum}: Invalid criteria format: "${part}". Use "Concept (3 pts)" or "Concept: 3"`);
      }
      criteria.push({ concept: match[1].trim(), points: parseInt(match[2]) });
    }

    return criteria;
  }

  async saveQuestions(tenantId: string, examId: string, questions: any[]) {
    const exam = await this.prisma.exam.findFirst({ where: { id: examId, tenantId } });
    if (!exam) throw new BadRequestException('Exam not found');

    const lastQuestion = await this.prisma.examQuestion.findFirst({
      where: { examId },
      orderBy: { orderIndex: 'desc' },
    });
    let orderIndex = lastQuestion ? lastQuestion.orderIndex + 1 : 1;

    const savedQuestions = [];

    for (const q of questions) {
      const question = await this.prisma.examQuestion.create({
        data: {
          tenantId,
          examId,
          type: q.type,
          questionText: q.questionText,
          maxPoints: q.maxPoints,
          orderIndex: orderIndex++,
        },
      });

      if (q.type === QuestionType.MCQ && q.options) {
        await this.prisma.examOption.createMany({
          data: q.options.map((opt: any) => ({
            tenantId,
            questionId: question.id,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect,
          })),
        });
      }

      if (q.type === QuestionType.THEORY && q.rubric) {
        await this.prisma.examRubric.create({
          data: {
            tenantId,
            questionId: question.id,
            modelAnswer: q.rubric.modelAnswer,
            gradingCriteria: q.rubric.gradingCriteria,
          },
        });
      }

      savedQuestions.push(question);
    }

    return savedQuestions;
  }
}