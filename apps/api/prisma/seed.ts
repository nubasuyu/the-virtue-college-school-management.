import { PrismaClient, UserRole, AttendanceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  // 1. CLEAR EXISTING DATA
  await prisma.aIGradingLog.deleteMany();
  await prisma.studentAnswer.deleteMany();
  await prisma.examAttempt.deleteMany();
  await prisma.examRubric.deleteMany();
  await prisma.examOption.deleteMany();
  await prisma.examQuestion.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.borrowing.deleteMany();
  await prisma.bookCopy.deleteMany();
  await prisma.book.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.reportComment.deleteMany();
  await prisma.behaviorScore.deleteMany();
  await prisma.academicHistory.deleteMany();
  await prisma.classHistory.deleteMany();
  await prisma.studentParent.deleteMany(); // 👈 NEW: Clear junction table
  await prisma.parent.deleteMany();
  await prisma.student.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class.deleteMany();
  await prisma.term.deleteMany();
  await prisma.academicSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('🗑️  Cleared existing data');

  // 2. CREATE TENANT
  const tenant = await prisma.tenant.create({
    data: {
      name: 'The Virtue College',
      shortName: 'TVC',
      domain: 'virtuecollege.edu',
      primaryColor: '#5C4033',
      secondaryColor: '#FFFDD0',
    },
  });

  // 3. CREATE USERS
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: { tenantId: tenant.id, email: 'admin@virtuecollege.edu', passwordHash, firstName: 'Super', lastName: 'Admin', role: UserRole.SUPER_ADMIN },
  });

  const schoolAdmin = await prisma.user.create({
    data: { tenantId: tenant.id, email: 'schooladmin@virtuecollege.edu', passwordHash, firstName: 'School', lastName: 'Administrator', role: UserRole.SCHOOL_ADMIN },
  });

  const teacher1 = await prisma.user.create({
    data: { tenantId: tenant.id, email: 'teacher1@virtuecollege.edu', passwordHash, firstName: 'John', lastName: 'Smith', role: UserRole.TEACHER },
  });

  const accountant = await prisma.user.create({
    data: { tenantId: tenant.id, email: 'accountant@virtuecollege.edu', passwordHash, firstName: 'Mike', lastName: 'Wilson', role: UserRole.ACCOUNTANT },
  });

  console.log('✅ Created Users');

  // 4. CREATE ACADEMIC SESSION & TERMS
  const session = await prisma.academicSession.create({
    data: {
      tenantId: tenant.id,
      name: '2025-2026 Academic Year',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-07-30'),
      isActive: true,
    },
  });

  const term1 = await prisma.term.create({
    data: { tenantId: tenant.id, sessionId: session.id, name: 'First Term', number: 1, startDate: new Date('2025-09-01'), endDate: new Date('2025-12-20'), isActive: true },
  });
  await prisma.term.create({
    data: { tenantId: tenant.id, sessionId: session.id, name: 'Second Term', number: 2, startDate: new Date('2026-01-10'), endDate: new Date('2026-04-15'), isActive: false },
  });
  await prisma.term.create({
    data: { tenantId: tenant.id, sessionId: session.id, name: 'Third Term', number: 3, startDate: new Date('2026-05-01'), endDate: new Date('2026-07-30'), isActive: false },
  });

  console.log('✅ Created Academic Session & 3 Terms');

  // 5. CREATE CLASSES & SUBJECTS
  const class1 = await prisma.class.create({
    data: { tenantId: tenant.id, name: 'Grade 10', section: 'A', classTeacherId: teacher1.id },
  });

  const math = await prisma.subject.create({ data: { tenantId: tenant.id, name: 'Mathematics', code: 'MATH101', description: 'Advanced Mathematics' } });
  const english = await prisma.subject.create({ data: { tenantId: tenant.id, name: 'English Language', code: 'ENG101', description: 'English Literature' } });

  // 6. CREATE 10 STUDENTS & PARENTS
  const students: any[] = [];
  
  for (let i = 1; i <= 10; i++) {
    const student = await prisma.student.create({
      data: {
        tenantId: tenant.id,
        admissionNo: `TVC2025${String(i).padStart(4, '0')}`,
        firstName: `Student${i}`,
        lastName: 'Demo',
        dateOfBirth: new Date('2008-05-15'),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        email: `student${i}@virtuecollege.edu`,
        currentClassId: class1.id,
        enrollmentTerm: 1,
        passwordHash: await bcrypt.hash('student123', 10),
        biometricId: `BIO-${String(i).padStart(3, '0')}`, 
      },
    });
    students.push(student);

    // Create Parent User
    const parentUser = await prisma.user.create({
      data: { 
        tenantId: tenant.id, 
        email: `parent${i}@virtuecollege.edu`, 
        passwordHash, 
        firstName: `Parent${i}`, 
        lastName: 'Demo', 
        role: UserRole.PARENT 
      },
    });

    // Create Parent Record
    const parent = await prisma.parent.create({
      data: {
        tenantId: tenant.id,
        firstName: `Parent${i}`,
        lastName: 'Demo',
        phone: `+234801234567${i}`,
        email: `parent${i}@virtuecollege.edu`,
        userId: parentUser.id,
      },
    });

    // 👇 NEW: Link Parent and Student using the StudentParent junction table
    await prisma.studentParent.create({
      data: {
        tenantId: tenant.id,
        studentId: student.id,
        parentId: parent.id,
        relation: 'Father',
        isPrimary: true,
      },
    });
  }

  console.log('✅ Created 10 Students & Parents with Biometric IDs');

  // 7. CREATE CLASS HISTORIES
  for (const student of students) {
    await prisma.classHistory.create({
      data: { studentId: student.id, classId: student.currentClassId!, sessionId: session.id, promoted: false },
    });
  }

  // 8. CREATE SCHEDULES
  await prisma.schedule.create({ data: { tenantId: tenant.id, classId: class1.id, subjectId: math.id, teacherId: teacher1.id, dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '09:00', roomName: 'Room 101', termId: term1.id } });
  await prisma.schedule.create({ data: { tenantId: tenant.id, classId: class1.id, subjectId: english.id, teacherId: teacher1.id, dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '10:00', roomName: 'Room 101', termId: term1.id } });

  // 9. CREATE ATTENDANCE RECORDS
  const today = new Date();
  const checkInDate = new Date(today);
  checkInDate.setHours(7, 45, 0, 0); 

  for (let i = 0; i < 5; i++) {
    await prisma.attendance.create({ 
      data: { 
        tenantId: tenant.id, 
        studentId: students[i].id, 
        classId: students[i].currentClassId!, 
        date: today, 
        status: AttendanceStatus.PRESENT,
        checkInTime: checkInDate, 
        deviceName: 'Front_Desk_Scanner' 
      } 
    });
  }

  // 10. CREATE EXAMS & GRADES
  const exam1 = await prisma.exam.create({
    data: { tenantId: tenant.id, termId: term1.id, name: 'Mid-Term Mathematics', assessmentType: 'Mid-Term', subjectId: math.id, classId: class1.id, date: new Date('2025-10-15'), totalMarks: 100, isOnline: true, durationMins: 60, shuffleOptions: true },
  });

  for (let i = 0; i < 5; i++) {
    await prisma.grade.create({
      data: {
        tenantId: tenant.id, examId: exam1.id, studentId: students[i].id, termId: term1.id,
        mcqScore: 35 + Math.floor(Math.random() * 10),
        theoryScore: 40 + Math.floor(Math.random() * 15),
        marksObtained: 75 + Math.floor(Math.random() * 20),
        grade: 'A', remarks: 'Excellent performance',
      },
    });
  }

  // 11. CREATE FEE STRUCTURES & PAYMENTS
  const tuitionFee = await prisma.feeStructure.create({
    data: { tenantId: tenant.id, name: 'Term 1 Tuition Fee', amount: 150000, currency: 'NGN', classId: class1.id, termId: term1.id, description: 'Standard tuition for First Term', dueDate: new Date('2025-09-30') },
  });

  const devFee = await prisma.feeStructure.create({
    data: { tenantId: tenant.id, name: 'Development Levy', amount: 25000, currency: 'NGN', classId: class1.id, termId: term1.id, description: 'One-time development fee', dueDate: new Date('2025-09-30') },
  });

  await prisma.payment.create({ 
    data: { tenantId: tenant.id, studentId: students[0].id, feeStructureId: tuitionFee.id, amount: 100000, currency: 'NGN', paymentMethod: 'BANK_TRANSFER', reference: 'TRF-998877', remarks: 'Partial payment' } 
  });

  await prisma.payment.create({ 
    data: { tenantId: tenant.id, studentId: students[1].id, feeStructureId: tuitionFee.id, amount: 150000, currency: 'NGN', paymentMethod: 'CARD', reference: 'PAY-112233', remarks: 'Full tuition payment' } 
  });
  await prisma.payment.create({ 
    data: { tenantId: tenant.id, studentId: students[1].id, feeStructureId: devFee.id, amount: 25000, currency: 'NGN', paymentMethod: 'CARD', reference: 'PAY-112234', remarks: 'Full development fee' } 
  });

  console.log('✅ Created Realistic Fee Structures & Payment Scenarios');

  // 12. CREATE LIBRARY BOOKS
  const book1 = await prisma.book.create({ data: { tenantId: tenant.id, title: 'Introduction to Algebra', author: 'John Doe', isbn: '978-1234567890', publisher: 'Math Press', publishedYear: 2020, category: 'Mathematics' } });
  await prisma.bookCopy.create({ data: { tenantId: tenant.id, bookId: book1.id, copyNumber: 1, status: 'AVAILABLE' } });

  // 13. CREATE ANNOUNCEMENTS
  await prisma.announcement.create({ data: { tenantId: tenant.id, title: 'Welcome to the New Academic Year', content: 'We are excited to welcome all students and staff to the 2025-2026 academic year.', authorId: admin.id, targetAudience: 'ALL', isPinned: true } });

  // 14. CREATE BEHAVIOR SCORES & REPORT COMMENTS
  await prisma.behaviorScore.create({ data: { studentId: students[0].id, termId: term1.id, sessionId: session.id, attendance: 9, attentiveness: 8, cooperation: 9, willingness: 8, labour: 7, leadership: 8, neatness: 9, politeness: 10 } });
  await prisma.reportComment.create({ data: { studentId: students[0].id, termId: term1.id, sessionId: session.id, teacherComment: 'Excellent student with great potential.', houseMasterComment: 'Well-behaved and respectful.', principalComment: 'Keep up the good work!', nextTermBegins: '2026-01-10' } });

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login Credentials (Password: password123):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👑 admin@virtuecollege.edu (SUPER_ADMIN)');
  console.log('👨‍🏫 teacher1@virtuecollege.edu (TEACHER)');
  console.log('👨‍👦 parent1@virtuecollege.edu (PARENT - Child owes ₦75,000)');
  console.log('👩‍👧 parent2@virtuecollege.edu (PARENT - Child is Fully Paid)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🖐️  Biometric Test IDs: BIO-001, BIO-002, BIO-003, etc.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });