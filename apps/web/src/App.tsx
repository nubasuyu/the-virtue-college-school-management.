import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';

// Protected Pages
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import Subjects from './pages/Subjects';
import Fees from './pages/Fees';
import Payments from './pages/Payments';
import Announcements from './pages/Announcements';
import Attendance from './pages/Attendance';
import Schedule from './pages/Schedule';
import Library from './pages/Library';
import Gradebook from './pages/GradeBook';
import ReportCard from './pages/ReportCard';
import Promotion from './pages/Promotion';
import ExamCreationForm from './components/exams/ExamCreationForm';
import BulkUploadTest from './pages/BulkUploadTest';
import StudentExamInterface from './pages/StudentExamInterface';
import StudentExamsList from './pages/StudentExamsList';
import TeacherGradingDashboard from './pages/TeacherGradingDashboard';
import MyChildren from './pages/MyChildren';
import AcademicSettings from './pages/AcademicSettings';

// ==========================================
// PROTECTED ROUTE COMPONENT
// ==========================================
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  if (!token || !storedUser) {
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(storedUser);
  } catch (e) {
    console.error('Failed to parse user:', e);
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-6xl font-bold text-red-600 mb-4">403</h1>
          <h2 className="text-2xl font-semibold text-[#5C4033] mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to view this page.</p>
          <button onClick={() => window.history.back()} className="px-6 py-2 bg-[#5C4033] text-[#FFFDD0] rounded-lg hover:bg-[#4B3621]">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// ==========================================
// MAIN APP COMPONENT
// ==========================================
function App() {
  return (
    <Router>
      <Routes>
        {/* 1. PUBLIC ROUTES */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        
        {/* 2. PROTECTED ROUTES (Wrapped in Layout) */}
        <Route element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="classes" element={<Classes />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="fees" element={<Fees />} />
          <Route path="payments" element={<Payments />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="library" element={<Library />} />
          <Route path="gradebook" element={<Gradebook />} />
          <Route path="report-card" element={<ReportCard />} />
          <Route path="promotion" element={<Promotion />} />
          <Route path="exams/create" element={<ExamCreationForm />} />
          <Route path="test-bulk-upload" element={<BulkUploadTest />} />
          <Route path="exam/:examId" element={<StudentExamInterface />} />
          <Route path="my-exams" element={<StudentExamsList />} />
          <Route path="grading" element={<TeacherGradingDashboard />} />
          <Route path="grading/:examId" element={<TeacherGradingDashboard />} />
          <Route path="my-children" element={<MyChildren />} />
          <Route path="academic-settings" element={<AcademicSettings />} />
        </Route>

        {/* 3. CATCH ALL - Redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;