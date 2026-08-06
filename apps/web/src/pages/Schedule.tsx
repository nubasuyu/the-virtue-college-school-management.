import { useEffect, useState } from 'react';
import api from '../lib/axios';

export default function Schedule() {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    teacherId: '',
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '10:30',
    roomName: '',
  });
  const [message, setMessage] = useState('');

  // 👇 GET USER ROLE FOR RBAC
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role;
  
  // Only Admins and Teachers can manage the schedule
  const canManageSchedule = role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN' || role === 'TEACHER';

  useEffect(() => {
    api.get('/schedule').then(res => setSchedule(res.data)).catch(console.error);
    
    // Only fetch dropdown data if the user can actually manage the schedule
    if (canManageSchedule) {
      api.get('/class').then(res => setClasses(res.data)).catch(console.error);
      api.get('/subject').then(res => setSubjects(res.data)).catch(console.error);
      api.get('/teacher').then(res => setTeachers(res.data)).catch(console.error);
    }
  }, [canManageSchedule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/schedule', formData);
      const res = await api.get('/schedule');
      setSchedule(res.data);
      setMessage('✅ Schedule entry added!');
      setTimeout(() => setMessage(''), 2000);
      setFormData({
        classId: '',
        subjectId: '',
        teacherId: '',
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '10:30',
        roomName: '',
      });
    } catch (error) {
      setMessage('❌ Failed to add entry.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this schedule entry?')) {
      try {
        await api.delete(`/schedule/${id}`);
        setSchedule(schedule.filter(s => s.id !== id));
      } catch (error) {
        console.error('Failed to delete');
      }
    }
  };

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#5C4033]">
        {canManageSchedule ? 'Timetable Manager' : 'Class Timetable'}
      </h2>

      {message && (
        <div className={`px-4 py-2 rounded text-sm font-medium ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* 👇 ADD NEW ENTRY FORM - ONLY FOR ADMINS/TEACHERS */}
      {canManageSchedule && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Add New Class to Timetable</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select required value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select required value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <select required value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Select Teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <select required value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="time" required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room (Optional)</label>
              <input type="text" placeholder="e.g., Room 101" value={formData.roomName} onChange={e => setFormData({...formData, roomName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="md:col-span-3 lg:col-span-6">
              <button type="submit" className="w-full bg-[#5C4033] text-[#FFFDD0] py-2 px-4 rounded-md hover:bg-[#4B3621] transition font-semibold">
                Add to Timetable
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 👇 WEEKLY SCHEDULE VIEW - VISIBLE TO ALL ROLES */}
      <div className="space-y-6">
        {days.map(day => {
          const daySchedule = schedule.filter(s => s.dayOfWeek === day);
          if (daySchedule.length === 0) return null;

          return (
            <div key={day} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">{day}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {daySchedule.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-6">
                      <div className="text-center w-24">
                        <p className="text-sm font-bold text-[#5C4033]">{entry.startTime}</p>
                        <p className="text-xs text-gray-500">to {entry.endTime}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{entry.subject?.name || 'Unknown Subject'}</p>
                        <p className="text-sm text-gray-500">
                          {entry.class?.name} - {entry.class?.section} • {entry.teacher?.firstName} {entry.teacher?.lastName}
                          {entry.roomName && ` • ${entry.roomName}`}
                        </p>
                      </div>
                    </div>
                    
                    {/* 👇 REMOVE BUTTON - ONLY FOR ADMINS/TEACHERS */}
                    {canManageSchedule && (
                      <button onClick={() => handleDelete(entry.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {schedule.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            No timetable entries yet. 
            {canManageSchedule ? ' Use the form above to create the school schedule!' : ' The school schedule has not been published yet.'}
          </div>
        )}
      </div>
    </div>
  );
}