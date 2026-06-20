import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 👇 Fetch all data in parallel for maximum speed! 👇
        const [studentsRes, teachersRes, classesRes] = await Promise.all([
          api.get('/student'),
          api.get('/teacher'),
          api.get('/class'),
        ]);

        setStats({
          students: studentsRes.data.length,
          teachers: teachersRes.data.length,
          classes: classesRes.data.length,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600 animate-pulse">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h1>
      <p className="text-gray-600 mb-8">Welcome back! Here is what is happening at your school today.</p>

      {/* 📊 Statistics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Students Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Students</p>
              <p className="text-4xl font-bold text-gray-800 mt-2">{stats.students}</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-full">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Teachers Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Teachers</p>
              <p className="text-4xl font-bold text-gray-800 mt-2">{stats.teachers}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Classes Card */}
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Classes</p>
              <p className="text-4xl font-bold text-gray-800 mt-2">{stats.classes}</p>
            </div>
            <div className="bg-purple-100 p-4 rounded-full">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 Quick Actions Section */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/students" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm">
            Manage Students
          </Link>
          <Link to="/teachers" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-sm">
            Manage Teachers
          </Link>
          <Link to="/classes" className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium shadow-sm">
            Manage Classes
          </Link>
        </div>
      </div>
    </div>
  );
}