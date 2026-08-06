import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { BookOpen, DollarSign, TrendingUp, Users, Calendar, FileText, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role;

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (role === 'PARENT') {
          // 👇 DYNAMICALLY get the first child's ID from the user object
          const studentId = user?.children?.[0]?.id;
          
          if (studentId) {
            const res = await api.get(`/fees/student/${studentId}/summary`);
            setStats(res.data);
          } else {
            // Fallback if no children are linked to the parent account yet
            setStats({ 
              student: { name: 'No children linked', admissionNo: 'N/A' }, 
              summary: { balance: 0, totalExpected: 0, totalPaid: 0 } 
            });
          }
        } else if (role === 'STUDENT') {
          setStats({ isStudent: true });
        } else {
          setStats({ isAdmin: true });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Fetch real announcements for the dashboard
    if (role === 'PARENT') {
      api.get('/announcement')
        .then(res => {
          // Get only the first 2 announcements to keep the dashboard clean
          setAnnouncements(res.data.slice(0, 2));
        })
        .catch(console.error);
    }
  }, [role, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5C4033]"></div>
      </div>
    );
  }

  // ==========================================
  // 🌟 PARENT DASHBOARD VIEW
  // ==========================================
  if (role === 'PARENT') {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#5C4033] to-[#7A5A4A] rounded-2xl p-6 text-[#FFFDD0] shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.firstName}!</h1>
          <p className="opacity-90">Here is a quick overview of your child's academic journey at The Virtue College.</p>
        </div>

        {/* Child Profile Card */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-[#FFFDD0] rounded-full flex items-center justify-center text-[#5C4033] font-bold text-2xl shadow-inner">
            {stats?.student?.name?.charAt(0) || 'S'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{stats?.student?.name || 'Student Name'}</h2>
            <p className="text-sm text-gray-500">Admission No: {stats?.student?.admissionNo || 'N/A'}</p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Attendance */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 text-green-700 rounded-lg">
                <Users size={24} />
              </div>
              <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full">Excellent</span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium">Attendance Rate</h3>
            <p className="text-3xl font-bold text-gray-800 mt-1">96%</p>
            <p className="text-xs text-gray-400 mt-2">Last 30 days</p>
          </div>

          {/* Fee Balance */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
                <DollarSign size={24} />
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stats?.summary?.balance > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {stats?.summary?.balance > 0 ? 'Outstanding' : 'Paid in Full'}
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium">Fee Balance</h3>
            <p className="text-3xl font-bold text-gray-800 mt-1">
              ₦{(stats?.summary?.balance || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-2">Total Expected: ₦{(stats?.summary?.totalExpected || 0).toLocaleString()}</p>
          </div>

          {/* Academic Performance */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
                <TrendingUp size={24} />
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-full">Current Term</span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium">Average Grade</h3>
            <p className="text-3xl font-bold text-gray-800 mt-1">A-</p>
            <p className="text-xs text-gray-400 mt-2">Top 15% of class</p>
          </div>
        </div>

        {/* Bottom Section: Announcements & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent Announcements */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-[#5C4033]" /> Recent Announcements
            </h3>
            <div className="space-y-4">
              {announcements.length > 0 ? (
                announcements.map((ann, idx) => (
                  <div 
                    key={ann.id} 
                    className={`p-4 bg-gray-50 rounded-lg border-l-4 ${idx === 0 ? 'border-[#5C4033]' : 'border-blue-500'}`}
                  >
                    <h4 className="font-semibold text-gray-800">{ann.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{ann.content}</p>
                    <span className="text-xs text-gray-400 mt-2 block">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No announcements yet.</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-[#5C4033]" /> Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/fees')}
                className="p-4 bg-[#5C4033] text-[#FFFDD0] rounded-lg hover:bg-[#4B3621] transition flex flex-col items-center justify-center gap-2 shadow-sm"
              >
                <DollarSign size={28} />
                <span className="font-semibold">View Fees</span>
              </button>
              <button 
                onClick={() => navigate('/report-card')}
                className="p-4 bg-white border-2 border-[#5C4033] text-[#5C4033] rounded-lg hover:bg-[#FFFDD0] transition flex flex-col items-center justify-center gap-2"
              >
                <FileText size={28} />
                <span className="font-semibold">Report Card</span>
              </button>
              <button 
                onClick={() => navigate('/library')}
                className="p-4 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition flex flex-col items-center justify-center gap-2"
              >
                <BookOpen size={28} />
                <span className="font-semibold">Library</span>
              </button>
              <button 
                onClick={() => navigate('/schedule')}
                className="p-4 bg-white border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition flex flex-col items-center justify-center gap-2"
              >
                <Calendar size={28} />
                <span className="font-semibold">Class Schedule</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // DEFAULT DASHBOARD (Admin/Teacher/Student)
  // ==========================================
  return (
    <div className="p-6">
      <div className="bg-gradient-to-r from-[#5C4033] to-[#7A5A4A] rounded-2xl p-6 text-[#FFFDD0] shadow-lg mb-6">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.firstName}!</h1>
        <p className="opacity-90">You are logged in as {role?.replace('_', ' ')}.</p>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <p className="text-gray-600 text-lg">Role-specific dashboard content for <strong>{role}</strong> goes here.</p>
      </div>
    </div>
  );
}