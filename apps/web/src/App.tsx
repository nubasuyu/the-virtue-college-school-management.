import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Public Pages
import LandingPage from './pages/LandingPage'; // ✅ NEW
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
  const location = useLocation();
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <h1 className="text-6xl font-bold text-red-600 mb-4">403</h1>
          <h2 className="text-2xl font-semibold text-[#5C4033] mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to view this page.</p>
          <button 
            onClick={() => window.history.back()} 
            className="px-6 py-2 bg-[#5C4033] text-[#FFFDD0] rounded-lg hover:bg-[#4B3621] transition font-medium"
          >
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
        {/* 1. PUBLIC ROUTES (No login required) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        
        {/* 2. PROTECTED ROUTES (Wrapped in Layout & ProtectedRoute) */}
        <Route element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="students" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT']}>
              <Students />
            </ProtectedRoute>
          } />
          
          <Route path="teachers" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN']}>
              <Teachers />
            </ProtectedRoute>
          } />
          
          <Route path="classes" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']}>
              <Classes />
            </ProtectedRoute>
          } />
          
          <Route path="subjects" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']}>
              <Subjects />
            </ProtectedRoute>
          } />
          
          <Route path="fees" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT', 'PARENT']}>
              <Fees />
            </ProtectedRoute>
          } />
          
          <Route path="payments" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT', 'PARENT']}>
              <Payments />
            </ProtectedRoute>
          } />
          
          <Route path="announcements" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT']}>
              <Announcements />
            </ProtectedRoute>
          } />
          
          <Route path="attendance" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']}>
              <Attendance />
            </ProtectedRoute>
          } />
          
          <Route path="schedule" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']}>
              <Schedule />
            </ProtectedRoute>
          } />
          
          <Route path="library" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']}>
              <Library />
            </ProtectedRoute>
          } />
          
          <Route path="gradebook" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']}>
              <Gradebook />
            </ProtectedRoute>
          } />
          
          <Route path="report-card" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']}>
              <ReportCard />
            </ProtectedRoute>
          } />
          
          <Route path="promotion" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN']}>
              <Promotion />
            </ProtectedRoute>
          } />
          
          <Route path="exams/create" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']}>
              <ExamCreationForm />
            </ProtectedRoute>
          } />
          
          <Route path="test-bulk-upload" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']}>
              <BulkUploadTest />
            </ProtectedRoute>
          } />
          
          <Route path="exam/:examId" element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN']}>
              <StudentExamInterface />
            </ProtectedRoute>
          } />
          
          <Route path="my-exams" element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER']}>
              <StudentExamsList />
            </ProtectedRoute>
          } />
          
          <Route path="grading" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']}>
              <TeacherGradingDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="grading/:examId" element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']}>
              <TeacherGradingDashboard />
            </ProtectedRoute>
          } />
        </Route>
        <Route path="my-children" element={
          <ProtectedRoute allowedRoles={['PARENT']}>
            <MyChildren />
          </ProtectedRoute>} />

          <Route path="academic-settings" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN']}><AcademicSettings /></ProtectedRoute>} />

        

        {/* 3. CATCH ALL (Redirect unknown routes to Landing Page) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;