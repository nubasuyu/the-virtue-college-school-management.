// apps/api/src/exam/exam.service.ts

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { CreateQuestionDto, QuestionType } from './dto/create-question.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ApproveGradeDto, GradingStatus } from './dto/approve-grade.dto';
import { Prisma, AttemptStatus } from '@prisma/client';
import { AiGradingService } from '../services/ai-grading.service';

@Injectable()
export class ExamService {
  constructor(
    private prisma: PrismaService,
    private aiGradingService: AiGradingService,
  ) {}

    // Add this to fetch all exams
     async findAll(tenantId: string, role: string, userId: string) {
    console.log('🔍 [DEBUG] findAll called with:', { tenantId, role, userId });

    if (role === 'STUDENT') {
      // 1. Find the student's classId
      const student = await this.prisma.student.findUnique({
        where: { id: userId },
        select: { currentClassId: true, tenantId: true }, // ⚠️ Check if your schema uses 'currentClassId' or 'classId'
      });

      console.log('🎓 [DEBUG] Found Student:', student);

      if (!student || !student.currentClassId) {
        console.log('⚠️ [DEBUG] Student has no class assigned!');
        return []; 
      }

      // 2. Return only online exams for that class
      const exams = await this.prisma.exam.findMany({
        where: {
          tenantId: tenantId,
          isOnline: true,
          classId: student.currentClassId,
        },
        include: { subject: true, class: true },
      });

      console.log('📦 [DEBUG] Found Exams for Student:', exams.length);
      return exams;
    }

    // For Admins/Teachers
    const exams = await this.prisma.exam.findMany({
      where: { tenantId: tenantId },
      include: { subject: true, class: true },
    });
    
    console.log('📦 [DEBUG] Found Exams for Admin/Teacher:', exams.length);
    return exams;
  }
  
  // Add this to fetch a single exam with its questions
    async findOne(tenantId: string, id: string, role: string, userId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
        subject: true,
        class: true,
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // ✅ Security Check 1: Ensure the exam belongs to the user's tenant
    if (exam.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have access to this exam');
    }

    // ✅ Security Check 2: If the user is a student, ensure the exam is assigned to their class
    if (role === 'STUDENT') {
      const student = await this.prisma.student.findUnique({
        where: { id: userId },
        select: { currentClassId: true }, // ⚠️ Change to 'classId' if your schema uses that instead
      });

      if (!student || student.currentClassId !== exam.classId) {
        throw new ForbiddenException('This exam is not assigned to your class');
      }
    }

    return exam;
  }

  
  // ==========================================
  // EXAM CREATION
  // ==========================================

  async createExam(tenantId: string, createExamDto: CreateExamDto) {
    return this.prisma.exam.create({
      data: {
        tenantId,
        name: createExamDto.name,
        assessmentType: createExamDto.assessmentType,
        subjectId: createExamDto.subjectId,
        classId: createExamDto.classId,
        termId: createExamDto.termId,
        date: new Date(createExamDto.date),
        totalMarks: createExamDto.totalMarks || 100,
        isOnline: createExamDto.isOnline || false,
        durationMins: createExamDto.durationMins,
        shuffleOptions: createExamDto.shuffleOptions || false,
      },
    });
  }

  async addQuestion(tenantId: string, examId: string, createQuestionDto: CreateQuestionDto) {
    // Verify exam exists and belongs to tenant
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, tenantId },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Get the next order index
    const lastQuestion = await this.prisma.examQuestion.findFirst({
      where: { examId },
      orderBy: { orderIndex: 'desc' },
    });

    const orderIndex = lastQuestion ? lastQuestion.orderIndex + 1 : 1;

    // Create the question
    const question = await this.prisma.examQuestion.create({
      data: {
        tenantId,
        examId,
        type: createQuestionDto.type,
        questionText: createQuestionDto.questionText,
        maxPoints: createQuestionDto.maxPoints,
        orderIndex,
      },
    });

    // Add options if MCQ
    if (createQuestionDto.type === QuestionType.MCQ && createQuestionDto.options) {
      await this.prisma.examOption.createMany({
        data: createQuestionDto.options.map((opt) => ({
          tenantId,
          questionId: question.id,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
        })),
      });
    }

    // Add rubric if Theory
    if (createQuestionDto.type === QuestionType.THEORY && createQuestionDto.rubric) {
      await this.prisma.examRubric.create({
        data: {
          tenantId,
          questionId: question.id,
          modelAnswer: createQuestionDto.rubric.modelAnswer,
          gradingCriteria: createQuestionDto.rubric.gradingCriteria,
        },
      });
    }

    return question;
  }

  // ==========================================
  // STUDENT EXAM EXECUTION
  // ==========================================

    async startExamAttempt(tenantId: string, examId: string, studentId: string) {
    // 1. Check if student already has ANY attempt for this exam
    const existingAttempt = await this.prisma.examAttempt.findFirst({
      where: {
        examId,
        studentId,
      },
    });

    // 2. If an attempt exists, check its status
    if (existingAttempt) {
      if (existingAttempt.status === AttemptStatus.IN_PROGRESS) {
        // Allow them to resume the exam
        console.log('🔄 Resuming existing IN_PROGRESS exam attempt for student:', studentId);
        return existingAttempt;
      } else {
        // If it's SUBMITTED or GRADED, block them from starting again
        throw new BadRequestException('You have already submitted this exam.');
      }
    }

    // 3. If no attempt exists, create a new one
    console.log('🆕 Creating new exam attempt for student:', studentId);
    return this.prisma.examAttempt.create({
      data: {
        tenantId,
        examId,
        studentId,
        status: AttemptStatus.IN_PROGRESS,
      },
    });
  }
  async saveAnswer(
    tenantId: string,
    attemptId: string,
    questionId: string,
    submitAnswerDto: SubmitAnswerDto,
  ) {
    // Verify attempt is in progress
    const attempt = await this.prisma.examAttempt.findFirst({
      where: { id: attemptId, tenantId, status: AttemptStatus.IN_PROGRESS },
    });

    if (!attempt) {
      throw new BadRequestException('Attempt not found or already submitted');
    }

    // Upsert the answer
    return this.prisma.studentAnswer.upsert({
      where: {
        attemptId_questionId: { attemptId, questionId },
      },
      update: {
        selectedOptionId: submitAnswerDto.selectedOptionId || null,
        submittedText: submitAnswerDto.submittedText || null,
        lastSavedAt: new Date(),
      },
      create: {
        tenantId,
        attemptId,
        questionId,
        selectedOptionId: submitAnswerDto.selectedOptionId || null,
        submittedText: submitAnswerDto.submittedText || null,
      },
    });
  }

  async submitExam(tenantId: string, attemptId: string, studentId: string) {
    const attempt = await this.prisma.examAttempt.findFirst({
      where: { id: attemptId, tenantId },
      include: {
        exam: true,
        answers: {
          include: {
            question: {
              include: {
                options: true,
                rubric: true,
              },
            },
          },
        },
      },
    });

    if (!attempt || attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Invalid or already submitted attempt');
    }

    let totalMcqScore = 0;
    let totalTheoryScore = 0;

    // Process each answer
    for (const answer of attempt.answers) {
      if (answer.question.type === QuestionType.MCQ) {
        const correctOption = answer.question.options.find((opt) => opt.isCorrect);
        const isCorrect = correctOption && answer.selectedOptionId === correctOption.id;
        const score = isCorrect ? answer.question.maxPoints : 0;
        totalMcqScore += score;

        await this.prisma.studentAnswer.update({
          where: { id: answer.id },
          data: { autoGradeScore: score },
        });
      } else if (answer.question.type === QuestionType.THEORY) {
        // Create AI grading log
        await this.prisma.aIGradingLog.create({
          data: {
            tenantId,
            studentAnswerId: answer.id,
            status: GradingStatus.PENDING_REVIEW,
          },
        });
      }
    }

    // Mark attempt as submitted
    await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.SUBMITTED,
        submitTime: new Date(),
      },
    });

    // Update main Grade model
    await this.prisma.grade.upsert({
      where: {
        examId_studentId: {
          examId: attempt.examId,
          studentId: studentId,
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
        studentId: studentId,
        termId: attempt.exam.termId,
        mcqScore: totalMcqScore,
        theoryScore: totalTheoryScore,
        marksObtained: totalMcqScore + totalTheoryScore,
      },
    });

    // Trigger AI grading in background
    this.aiGradingService.gradeAllPendingTheoryAnswers(tenantId).catch((error) => {
      console.error('Auto-grading error:', error);
    });

    return {
      mcqScore: totalMcqScore,
      status: AttemptStatus.SUBMITTED,
    };
  }

  // ==========================================
  // TEACHER GRADING DASHBOARD
  // ==========================================

  async getPendingGrades(tenantId: string, examId: string) {
    return this.prisma.aIGradingLog.findMany({
      where: {
        tenantId,
        status: {
          in: [GradingStatus.PENDING_REVIEW, GradingStatus.FLAGGED],
        },
        studentAnswer: {
          attempt: {
            examId: examId,
          },
        },
      },
      include: {
        studentAnswer: {
          include: {
            attempt: {
              include: {
                student: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    admissionNo: true,
                  },
                },
              },
            },
            question: {
              select: {
                id: true,
                questionText: true,
                maxPoints: true,
              },
            },
          },
        },
      },
      orderBy: [{ aiConfidence: 'asc' }],
    });
  }

  async approveGrade(
    tenantId: string,
    logId: string,
    teacherId: string,
    approveGradeDto: ApproveGradeDto,
  ) {
    const log = await this.prisma.aIGradingLog.findFirst({
      where: { id: logId, tenantId },
      include: {
        studentAnswer: {
          include: {
            question: true,
            attempt: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException('Grading log not found');
    }

    const maxPoints = log.studentAnswer.question.maxPoints;
    if (
      approveGradeDto.teacherFinalScore !== undefined &&
      (approveGradeDto.teacherFinalScore < 0 || approveGradeDto.teacherFinalScore > maxPoints)
    ) {
      throw new BadRequestException(`Score must be between 0 and ${maxPoints}`);
    }

    const updatedLog = await this.prisma.aIGradingLog.update({
      where: { id: logId },
      data: {
        teacherFinalScore:
          approveGradeDto.teacherFinalScore !== undefined
            ? approveGradeDto.teacherFinalScore
            : log.aiSuggestedScore,
        teacherFinalFeedback:
          approveGradeDto.teacherFinalFeedback !== undefined
            ? approveGradeDto.teacherFinalFeedback
            : log.aiFeedback,
        status: approveGradeDto.status || GradingStatus.APPROVED,
        reviewedById: teacherId,
        reviewedAt: new Date(),
      },
    });

    // Re-aggregate scores if approved
    if (updatedLog.status === GradingStatus.APPROVED) {
      await this.aiGradingService.aggregateExamScores(log.studentAnswer.attemptId, tenantId);
    }

    return updatedLog;
  }
}