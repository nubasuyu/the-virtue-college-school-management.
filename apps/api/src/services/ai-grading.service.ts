// apps/api/src/services/ai-grading.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust path if your PrismaService is elsewhere
import { GradingStatus, QuestionType } from '@prisma/client';
import OpenAI from 'openai';

@Injectable()
export class AiGradingService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async gradeAllPendingTheoryAnswers(tenantId: string): Promise<void> {
    const pendingLogs = await this.prisma.aIGradingLog.findMany({
      where: { tenantId, status: GradingStatus.PENDING_REVIEW },
      include: {
        studentAnswer: {
          include: {
            question: {
              include: {
                rubric: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${pendingLogs.length} pending theory answers to grade`);

    for (const log of pendingLogs) {
      await this.gradeTheoryAnswer(log.studentAnswerId, tenantId);
      // Small delay to avoid hitting OpenAI rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  private async gradeTheoryAnswer(studentAnswerId: string, tenantId: string): Promise<void> {
    const answer = await this.prisma.studentAnswer.findUnique({
      where: { id: studentAnswerId, tenantId },
      include: {
        question: {
          include: {
            rubric: true,
          },
        },
        aiGradingLog: true,
      },
    });

    if (!answer || !answer.question.rubric || !answer.submittedText) {
      console.error('Missing data for grading:', studentAnswerId);
      return;
    }

    const prompt = this.buildGradingPrompt(
      answer.question.questionText,
      answer.question.maxPoints,
      answer.question.rubric.modelAnswer,
      answer.question.rubric.gradingCriteria,
      answer.submittedText,
    );

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert, fair, and precise educational grader for The Virtue College.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content || '';
      const aiResponse = this.parseAIResponse(responseText);

      if (!aiResponse || typeof aiResponse.suggested_score !== 'number') {
        console.error('Invalid AI response structure:', aiResponse);
        await this.prisma.aIGradingLog.update({
          where: { studentAnswerId },
          data: { status: GradingStatus.FLAGGED },
        });
        return;
      }

      await this.prisma.aIGradingLog.update({
        where: { studentAnswerId },
        data: {
          aiSuggestedScore: aiResponse.suggested_score,
          aiConfidence: aiResponse.confidence_level,
          aiFeedback: aiResponse.draft_feedback,
          status: GradingStatus.PENDING_REVIEW,
        },
      });

      console.log(`Graded answer ${studentAnswerId}: ${aiResponse.suggested_score}/${answer.question.maxPoints}`);
    } catch (error) {
      console.error('OpenAI API error:', error);
      await this.prisma.aIGradingLog.update({
        where: { studentAnswerId },
        data: { status: GradingStatus.FLAGGED },
      });
    }
  }

  async aggregateExamScores(attemptId: string, tenantId: string): Promise<void> {
    const attempt = await this.prisma.examAttempt.findFirst({
      where: { id: attemptId, tenantId },
      include: {
        exam: true,
        answers: {
          include: {
            question: true,
            aiGradingLog: true,
          },
        },
      },
    });

    if (!attempt) return;

    let totalMcqScore = 0;
    let totalTheoryScore = 0;

    for (const answer of attempt.answers) {
      if (answer.question.type === QuestionType.MCQ) {
        totalMcqScore += answer.autoGradeScore || 0;
      } else if (answer.question.type === QuestionType.THEORY) {
        if (answer.aiGradingLog?.status === GradingStatus.APPROVED) {
          totalTheoryScore += answer.aiGradingLog.teacherFinalScore || 0;
        }
      }
    }

    await this.prisma.grade.upsert({
      where: {
        examId_studentId: {
          examId: attempt.examId,
          studentId: attempt.studentId,
        },
      },
      update: {
        mcqScore: totalMcqScore,
        theoryScore: totalTheoryScore,
        marksObtained: totalMcqScore + totalTheoryScore,
        updatedAt: new Date(),
      },
      create: {
        tenantId,
        examId: attempt.examId,
        studentId: attempt.studentId,
        termId: attempt.exam.termId,
        mcqScore: totalMcqScore,
        theoryScore: totalTheoryScore,
        marksObtained: totalMcqScore + totalTheoryScore,
      },
    });

    console.log(`Aggregated scores for attempt ${attemptId}: MCQ=${totalMcqScore}, Theory=${totalTheoryScore}`);
  }

  private buildGradingPrompt(
    questionText: string,
    maxPoints: number,
    modelAnswer: string,
    gradingCriteria: any,
    studentAnswer: string,
  ): string {
    return `[Question]: ${questionText}
[Max Points]: ${maxPoints}
[Model Answer]: ${modelAnswer}
[Grading Rubric]: ${JSON.stringify(gradingCriteria, null, 2)}
[Student Answer]: ${studentAnswer}

INSTRUCTIONS:
1. Evaluate the student's answer against the specific concepts listed in the Grading Rubric.
2. Award partial credit if a concept is partially addressed. Do not award points for correct information not in the rubric.
3. Be lenient with grammar; focus on core academic concepts.
4. If blank or irrelevant, set confidence to 0.0 and score to 0.

OUTPUT FORMAT (JSON ONLY):
{
  "suggested_score": <number>,
  "confidence_level": <0.0 to 1.0>,
  "reasoning": "<Brief explanation>",
  "draft_feedback": "<Constructive feedback>"
}`;
  }

  private parseAIResponse(responseText: string): any {
    try {
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse AI response:', responseText);
      return null;
    }
  }
}