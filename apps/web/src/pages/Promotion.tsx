import { useState, useEffect } from 'react';
import api from '../lib/axios';

export default function Promotion() {
  const [classes, setClasses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  
  const [sourceClassId, setSourceClassId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [status, setStatus] = useState('PROMOTED');
  
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    api.get('/class').then(res => setClasses(res.data)).catch(console.error);
    api.get('/academic-session').then(res => setSessions(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (sourceClassId) {
      setLoading(true);
      setResult(null);
      api.get(`/promotion/class/${sourceClassId}`)
        .then(res => {
          setStudents(res.data);
          setSelectedStudentIds(res.data.map((s: any) => s.id));
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setStudents([]);
      setSelectedStudentIds([]);
    }
  }, [sourceClassId]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudentIds(students.map((s) => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  const handlePromote = async () => {
    if (!targetClassId || !sessionId || selectedStudentIds.length === 0) {
      alert('Please select a Target Class, Session, and at least one student.');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} ${selectedStudentIds.length} student(s)? This action will archive their current class history.`)) {
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/promotion/bulk', {
        studentIds: selectedStudentIds,
        newClassId: targetClassId,
        sessionId: sessionId,
        status: status
      });
      setResult(res.data);
      api.get(`/promotion/class/${sourceClassId}`).then(res => {
        setStudents(res.data);
        setSelectedStudentIds([]);
      });
    } catch (err) {
      console.error(err);
      alert('An error occurred during promotion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-brown-800">Student Promotion Center</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-brown-800">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">1. Configure Promotion Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Class (Current)</label>
            <select 
              value={sourceClassId} 
              onChange={e => setSourceClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brown-500 focus:border-brown-500"
            >
              <option value="">-- Select Source Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Class (Next)</label>
            <select 
              value={targetClassId} 
              onChange={e => setTargetClassId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brown-500 focus:border-brown-500"
            >
              <option value="">-- Select Target Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Session</label>
            <select 
              value={sessionId} 
              onChange={e => setSessionId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brown-500 focus:border-brown-500"
            >
              <option value="">-- Select Session --</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action Status</label>
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brown-500 focus:border-brown-500"
            >
              <option value="PROMOTED">Promoted</option>
              <option value="REPEATED">Repeated Class</option>
              <option value="GRADUATED">Graduated</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>
        </div>
      </div>

      {sourceClassId && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">2. Select Students to Promote</h2>
            <span className="text-sm text-gray-500">
              {selectedStudentIds.length} of {students.length} selected
            </span>
          </div>

          {loading && students.length === 0 ? (
            <div className="text-center py-10 text-gray-500">Loading students...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No students found in this class.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-cream-100">
                  <tr>
                    <th className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={selectedStudentIds.length === students.length && students.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-brown-600 bg-gray-100 border-gray-300 rounded focus:ring-brown-500"
                      />
                    </th>
                    <th className="px-4 py-3">Admission No</th>
                    <th className="px-4 py-3">Student Name</th>
                    <th className="px-4 py-3">Current Class</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="bg-white border-b hover:bg-cream-50">
                      <td className="px-4 py-3">
                        <input 
                          type="checkbox" 
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => handleSelectStudent(student.id)}
                          className="w-4 h-4 text-brown-600 bg-gray-100 border-gray-300 rounded focus:ring-brown-500"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{student.admissionNo}</td>
                      <td className="px-4 py-3">{student.firstName} {student.lastName}</td>
                      <td className="px-4 py-3">{student.currentClass?.name} {student.currentClass?.section}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button 
              onClick={handlePromote}
              disabled={loading || selectedStudentIds.length === 0 || !targetClassId || !sessionId}
              className="bg-brown-800 text-cream-50 px-6 py-3 rounded-md hover:bg-brown-900 transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg"
            >
              {loading ? 'Processing...' : `🚀 Execute Promotion (${selectedStudentIds.length})`}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className={`p-6 rounded-lg shadow-md border-l-4 ${result.failed === 0 ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'}`}>
          <h3 className="text-lg font-bold mb-2">Promotion Summary</h3>
          <p className="text-gray-700">
            ✅ <strong>{result.success}</strong> students were successfully {status.toLowerCase()}.
          </p>
          {result.failed > 0 && (
            <div className="mt-2">
              <p className="text-red-600 font-semibold">❌ {result.failed} students failed:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                {result.errors.map((err: any, idx: number) => (
                  <li key={idx}>{err.name}: {err.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}