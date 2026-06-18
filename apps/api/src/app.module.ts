import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { StudentModule } from './student/student.module';
import { ClassModule } from './class/class.module';
import { TeacherModule } from './teacher/teacher.module';
import { SubjectModule } from './subject/subject.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ExamModule } from './exam/exam.module';
import { GradeModule } from './grade/grade.module';
import { AcademicSessionModule } from './academic-session/academic-session.module';
import { TermModule } from './term/term.module';
import { ReportCardModule } from './report-card/report-card.module';
import { PromotionModule } from './promotion/promotion.module';
import { FeesModule } from './fees/fees.module';



@Module({
  imports: [PrismaModule, AuthModule, UserModule, StudentModule, ClassModule, TeacherModule, SubjectModule, AttendanceModule, ExamModule, GradeModule, AcademicSessionModule, TermModule, ReportCardModule, PromotionModule, FeesModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}