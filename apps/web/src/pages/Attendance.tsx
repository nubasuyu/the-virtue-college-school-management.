import { useEffect, useState } from 'react';
import api from '../lib/axios';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'UNMARKED';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
}

export default function Attendance() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Get logged-in user from localStorage
   const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const userRole = currentUser?.role?.toString().toUpperCase() || '';
  const isTeacher = userRole.includes('ADMIN') || userRole.includes('TEACHER');

 
  // Fetch classes on load
  useEffect(() => {
    if (isTeacher) {
      api.get('/class').then(res => setClasses(res.data)).catch(console.error);
    } else if (currentUser?.currentClassId) {
      setSelectedClass(currentUser.currentClassId);
    }
  }, [isTeacher, currentUser?.currentClassId]);

  // Fetch students when class is selected
  useEffect(() => {
    if (!selectedClass) return;

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await api.get('/student');
        let classStudents = res.data.filter((s: any) => s.currentClassId === selectedClass);

        // Students only see themselves
        if (!isTeacher && currentUser?.id) {
          classStudents = classStudents.filter((s: any) => s.id === currentUser.id);
        }

        setStudents(classStudents);

        // Initialize all as UNMARKED
        const initialAttendance: Record<string, AttendanceStatus> = {};
        classStudents.forEach((s: Student) => {
          initialAttendance[s.id] = 'UNMARKED';
        });
        setAttendance(initialAttendance);
      } catch (error) {
        console.error('Error fetching students:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass, isTeacher, currentUser?.id]);

  // Handle card click
  const handleStudentClick = async (studentId: string) => {
    const currentStatus = attendance[studentId] || 'UNMARKED';
    
    let nextStatus: AttendanceStatus;
    if (currentStatus === 'UNMARKED') {
      nextStatus = 'PRESENT';
    } else if (currentStatus === 'PRESENT') {
      nextStatus = 'ABSENT';
    } else {
      nextStatus = 'UNMARKED';
    }

    // Update UI instantly
    setAttendance(prev => ({ ...prev, [studentId]: nextStatus }));

    // Save to backend if PRESENT or ABSENT
    if (nextStatus !== 'UNMARKED') {
      console.log('📤 Sending attendance data:', payload); // 👈 ADD THIS LINE
      console.log('🔍 selectedClass value:', selectedClass); // 👈 ADD THIS LINE
      try {
        await api.post('/attendance/mark', {
          studentId,
          classId: selectedClass,
          date: selectedDate,
          status: nextStatus,
        });
        setMessage(`✅ ${nextStatus} saved!`);
        setTimeout(() => setMessage(''), 1500);
      } catch (error) {
        console.error('Failed to save:', error);
        setAttendance(prev => ({ ...prev, [studentId]: currentStatus }));
        setMessage('❌ Failed to save.');
      }
    }
  };

  // Get card styles
  const getCardStyles = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-500 text-white border-green-600 shadow-lg scale-105';
      case 'ABSENT':
        return 'bg-red-500 text-white border-red-600 shadow-lg scale-105';
      case 'UNMARKED':
        return 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:shadow-md';
    }
  };

  // Count stats
  const presentCount = Object.values(attendance).filter(s => s === 'PRESENT').length;
  const absentCount = Object.values(attendance).filter(s => s === 'ABSENT').length;
  const unmarkedCount = Object.values(attendance).filter(s => s === 'UNMARKED').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {isTeacher ? 'Teacher Attendance Board' : 'Student Self Check-In'}
        </h2>
        {message && (
          <div className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm ${
            message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end">
        {isTeacher && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a class...</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.section}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats */}
      {selectedClass && students.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
            <p className="text-2xl font-bold text-green-700">{presentCount}</p>
            <p className="text-sm text-green-600">Present</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
            <p className="text-2xl font-bold text-red-700">{absentCount}</p>
            <p className="text-sm text-red-600">Absent</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-200">
            <p className="text-2xl font-bold text-gray-700">{unmarkedCount}</p>
            <p className="text-sm text-gray-600">Unmarked</p>
          </div>
        </div>
      )}

      {/* Student Grid */}
      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading students...</div>
      ) : selectedClass && students.length > 0 ? (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-4 text-center">
            {isTeacher
              ? '💡 Tap any student card to mark their attendance.'
              : '👆 Tap your card below to mark your own attendance.'}
          </p>
          <div className={`grid gap-4 ${
            isTeacher 
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' 
              : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-2xl mx-auto'
          }`}>
            {students.map((student) => {
              const status = attendance[student.id] || 'UNMARKED';
              return (
                <button
                  key={student.id}
                  onClick={() => handleStudentClick(student.id)}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center h-40 ${
                    getCardStyles(status)
                  }`}
                >
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-3 ${
                      status === 'UNMARKED' ? 'bg-gray-200 text-gray-600' : 'bg-white/20 text-white'
                    }`}
                  >
                    {student.firstName[0]}
                    {student.lastName[0]}
                  </div>
                  <p className="font-bold text-lg text-center leading-tight">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className={`text-sm mt-1 ${status === 'UNMARKED' ? 'text-gray-500' : 'text-white/80'}`}>
                    {student.admissionNo}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          {isTeacher ? 'Select a class above to start.' : 'Please log in to mark your attendance.'}
        </div>
      )}
    </div>
  );
}