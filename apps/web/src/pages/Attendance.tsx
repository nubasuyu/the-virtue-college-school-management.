import { useEffect, useState } from 'react';
import api from '../lib/axios';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'UNMARKED';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  currentClassId: string;
}

interface AttendanceRecord {
  id: string;
  studentId?: string;
  userId?: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  deviceName?: string;
  student?: any;
  user?: any;
}

export default function Attendance() {
  const [activeTab, setActiveTab] = useState<'students' | 'staff'>('students');
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const userRole = currentUser?.role?.toString().toUpperCase() || '';
  const isTeacherOrAdmin = userRole.includes('ADMIN') || userRole.includes('TEACHER') || userRole.includes('ACCOUNTANT');

  // Fetch classes on load
  useEffect(() => {
    if (isTeacherOrAdmin) {
      api.get('/class').then(res => setClasses(res.data)).catch(console.error);
    } else if (currentUser?.currentClassId) {
      setSelectedClass(currentUser.currentClassId);
    }
  }, [isTeacherOrAdmin, currentUser?.currentClassId]);

  // Fetch students/staff and their attendance when tab, class, or date changes
  useEffect(() => {
    if (activeTab === 'students' && !selectedClass && isTeacherOrAdmin) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'students') {
          // 1. Fetch students
          const res = await api.get('/student');
          let classStudents = res.data.filter((s: any) => s.currentClassId === selectedClass);

          if (!isTeacherOrAdmin && currentUser?.userId) {
            classStudents = classStudents.filter((s: any) => s.id === currentUser.userId);
          }
          setStudents(classStudents);

          // 2. Fetch existing attendance for this class and date
          const attRes = await api.get(`/attendance/class/${selectedClass}?date=${selectedDate}`);
          const attMap: Record<string, AttendanceRecord> = {};
          attRes.data.forEach((record: AttendanceRecord) => {
            if (record.studentId) {
              attMap[record.studentId] = record;
            }
          });
          setAttendance(attMap);
        } else if (activeTab === 'staff' && isTeacherOrAdmin) {
          // Fetch staff attendance for the selected date
          const attRes = await api.get(`/attendance/staff?date=${selectedDate}`);
          const attMap: Record<string, AttendanceRecord> = {};
          attRes.data.forEach((record: AttendanceRecord) => {
            if (record.userId) {
              attMap[record.userId] = record;
            }
          });
          setAttendance(attMap);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, selectedClass, selectedDate, isTeacherOrAdmin, currentUser?.userId]);

  // Handle card click (Manual Marking)
  const handleMarkAttendance = async (personId: string, isStudent: boolean) => {
    const currentRecord = attendance[personId];
    const currentStatus = currentRecord?.status || 'UNMARKED';
    
    let nextStatus: AttendanceStatus;
    if (currentStatus === 'UNMARKED') nextStatus = 'PRESENT';
    else if (currentStatus === 'PRESENT') nextStatus = 'LATE';
    else if (currentStatus === 'LATE') nextStatus = 'ABSENT';
    else if (currentStatus === 'ABSENT') nextStatus = 'EXCUSED';
    else nextStatus = 'UNMARKED';

    // Update UI instantly
    setAttendance(prev => ({ 
      ...prev, 
      [personId]: { ...(prev[personId] || {}), [isStudent ? 'studentId' : 'userId']: personId, status: nextStatus } 
    }));

    if (nextStatus !== 'UNMARKED') {
      try {
        const payload: any = {
          date: selectedDate,
          status: nextStatus,
        };
        if (isStudent) {
          payload.studentId = personId;
          payload.classId = selectedClass;
        } else {
          payload.userId = personId;
        }

        await api.post('/attendance/mark', payload);
        setMessage(`✅ Marked as ${nextStatus}`);
        setTimeout(() => setMessage(''), 1500);
      } catch (error) {
        console.error('Failed to save:', error);
        setAttendance(prev => ({ ...prev, [personId]: currentRecord || { status: 'UNMARKED' } }));
        setMessage('❌ Failed to save.');
      }
    }
  };

  const getCardStyles = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-500 text-white border-green-600 shadow-lg scale-105';
      case 'LATE': return 'bg-yellow-500 text-white border-yellow-600 shadow-lg scale-105';
      case 'ABSENT': return 'bg-red-500 text-white border-red-600 shadow-lg scale-105';
      case 'EXCUSED': return 'bg-blue-500 text-white border-blue-600 shadow-lg scale-105';
      case 'UNMARKED': return 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:shadow-md';
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Count stats
  const records = Object.values(attendance);
  const presentCount = records.filter(s => s.status === 'PRESENT' || s.status === 'LATE').length;
  const absentCount = records.filter(s => s.status === 'ABSENT').length;
  const unmarkedCount = (activeTab === 'students' ? students.length : Object.keys(attendance).length) - presentCount - absentCount;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Attendance Dashboard</h2>
        {message && (
          <div className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm ${
            message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Tabs */}
      {isTeacherOrAdmin && (
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 font-semibold rounded-t-lg transition ${
              activeTab === 'students' ? 'bg-[#5C4033] text-[#FFFDD0]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 font-semibold rounded-t-lg transition ${
              activeTab === 'staff' ? 'bg-[#5C4033] text-[#FFFDD0]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Staff
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-end">
        {activeTab === 'students' && isTeacherOrAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
            >
              <option value="">Choose a class...</option>
              {classes.map((cls: any) => (
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
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#5C4033]"
          />
        </div>
      </div>

      {/* Stats */}
      {(activeTab === 'students' ? (selectedClass && students.length > 0) : Object.keys(attendance).length > 0) && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
            <p className="text-2xl font-bold text-green-700">{presentCount}</p>
            <p className="text-sm text-green-600">Present / Late</p>
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

      {/* Grid */}
      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading attendance records...</div>
      ) : activeTab === 'students' && selectedClass && students.length > 0 ? (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-4 text-center">
            💡 Tap any student card to manually mark their attendance. Biometric scans will auto-update.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {students.map((student) => {
              const record = attendance[student.id];
              const status = record?.status || 'UNMARKED';
              return (
                <button
                  key={student.id}
                  onClick={() => handleMarkAttendance(student.id, true)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center min-h-[160px] ${getCardStyles(status)}`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mb-2 ${
                    status === 'UNMARKED' ? 'bg-gray-200 text-gray-600' : 'bg-white/20 text-white'
                  }`}>
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <p className="font-bold text-sm text-center leading-tight mb-1">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className={`text-xs mb-2 ${status === 'UNMARKED' ? 'text-gray-500' : 'text-white/80'}`}>
                    {student.admissionNo}
                  </p>
                  {(record?.checkInTime || record?.checkOutTime) && (
                    <div className="text-xs bg-black/20 px-2 py-1 rounded text-white/90 w-full text-center">
                      {record.checkInTime && <span>In: {formatTime(record.checkInTime)}</span>}
                      {record.checkInTime && record.checkOutTime && <span> • </span>}
                      {record.checkOutTime && <span>Out: {formatTime(record.checkOutTime)}</span>}
                    </div>
                  )}
                  {record?.deviceName && (
                    <span className="absolute top-2 right-2 text-[10px] bg-black/20 text-white px-1.5 py-0.5 rounded">
                      📱 {record.deviceName.replace(/_/g, ' ')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : activeTab === 'staff' && isTeacherOrAdmin ? (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
           <p className="text-sm text-gray-600 mb-4 text-center">
            📋 Daily Staff Attendance Log. Tap to manually override status.
          </p>
          {Object.keys(attendance).length === 0 ? (
             <div className="text-center text-gray-500 py-8">No staff attendance records for this date yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Object.values(attendance).map((record) => {
                const person = record.user;
                const status = record.status;
                return (
                  <button
                    key={record.id}
                    onClick={() => handleMarkAttendance(record.userId!, false)}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center min-h-[160px] ${getCardStyles(status)}`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mb-2 ${
                      status === 'UNMARKED' ? 'bg-gray-200 text-gray-600' : 'bg-white/20 text-white'
                    }`}>
                      {person?.firstName?.[0]}{person?.lastName?.[0]}
                    </div>
                    <p className="font-bold text-sm text-center leading-tight mb-1">
                      {person?.firstName} {person?.lastName}
                    </p>
                    <p className={`text-xs mb-2 ${status === 'UNMARKED' ? 'text-gray-500' : 'text-white/80'}`}>
                      {person?.role?.replace('_', ' ')}
                    </p>
                    {(record.checkInTime || record.checkOutTime) && (
                      <div className="text-xs bg-black/20 px-2 py-1 rounded text-white/90 w-full text-center">
                        {record.checkInTime && <span>In: {formatTime(record.checkInTime)}</span>}
                        {record.checkInTime && record.checkOutTime && <span> • </span>}
                        {record.checkOutTime && <span>Out: {formatTime(record.checkOutTime)}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          {activeTab === 'students' && !isTeacherOrAdmin 
            ? 'Please log in to mark your attendance.' 
            : 'Select a class above to start.'}
        </div>
      )}
    </div>
  )};