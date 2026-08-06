import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ ADDED
//import { CheckCircle } from 'lucide-react'; // ✅ ADDED
import api from '../lib/axios';
import BulkUploadQuestions from '../components/exams/BulkUploadQuestions';

export default function Gradebook() {
 // const navigate = useNavigate(); // ✅ ADDED
  console.log('🔍 Gradebook component starting...');
  
  const navigate = useNavigate();
  console.log('✅ Navigate function loaded:', navigate);
  
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  
  const [students, setStudents] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  const [examForm, setExamForm] = useState({ 
    name: '', 
    subjectId: '', 
    classId: '',  
    totalMarks: 100, 
    termId: '',
    isOnline: false 
  });

  const [showQuestionManager, setShowQuestionManager] = useState(false);
  const [createdOnlineExamId, setCreatedOnlineExamId] = useState<string | null>(null);
  const [createdOnlineExamName, setCreatedOnlineExamName] = useState<string>('');

  useEffect(() => {
    api.get('/class').then(res => setClasses(res.data)).catch(console.error);
    api.get('/subject').then(res => setSubjects(res.data)).catch(console.error);
    api.get('/term').then(res => setTerms(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedClass) {
      api.get(`/grade/exams/class/${selectedClass}`)
        .then(res => setExams(res.data))
        .catch(console.error);
    } else {
      setExams([]);
    }
    setSelectedExam('');
    setStudents([]);
  }, [selectedClass]);

  useEffect(() => {
    if (selectedExam) {
      api.get(`/grade/exam/${selectedExam}`)
        .then(res => setStudents(res.data))
        .catch(console.error);
    } else {
      setStudents([]);
    }
  }, [selectedExam]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!examForm.termId || !examForm.classId) {
      setMessage('❌ Please select a Term and a Class!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    try {
      const payload: any = {
        name: examForm.name,
        subjectId: examForm.subjectId,
        classId: examForm.classId,
        totalMarks: examForm.totalMarks,
        assessmentType: 'CA',
        date: new Date().toISOString(),
        termId: examForm.termId,
        isOnline: examForm.isOnline,
      };

      const res = await api.post('/exams', payload);
      const newExam = res.data; 
      
      if (examForm.isOnline) {
        setCreatedOnlineExamId(newExam.id);
        setCreatedOnlineExamName(newExam.name);
        setShowQuestionManager(true);
        setMessage('✅ Online Exam created! Now add questions.');
      } else {
        setSelectedClass(examForm.classId);
        const examsRes = await api.get(`/grade/exams/class/${examForm.classId}`);
        setExams(examsRes.data);
        setMessage('✅ Exam created! Select it below to input grades.');
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ Failed to create exam.');
      console.error(error);
    }
  };

  const handleScoreChange = async (studentId: string, field: 'mcqScore' | 'theoryScore', rawValue: string) => {
    const value = rawValue === '' || isNaN(Number(rawValue)) ? 0 : Number(rawValue);
    
    try {
      const payload = {
        examId: selectedExam,
        studentId,
        [field]: value,
      };

      const res = await api.post('/grade', payload);
      
      setStudents(prev => prev.map(s => 
        s.studentId === studentId 
          ? { 
              ...s, 
              mcqScore: res.data.mcqScore, 
              theoryScore: res.data.theoryScore, 
              marksObtained: res.data.marksObtained, 
              grade: res.data.grade, 
              remarks: res.data.remarks 
            }
          : s
      ));
      
      setMessage('✅ Score saved!');
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      setMessage('❌ Failed to save score.');
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem('token') || localStorage.getItem('authToken') || '';
  };
  
  return (
    <div className="space-y-6">
      {/* ✅ FIXED HEADER WITH BUTTON */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Teacher's Auto-Grading Book</h2>
       {/*  <button 
          onClick={() => navigate('/grading')} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 shadow-sm"
        >
          <CheckCircle size={18} /> Open AI Grading Queue
        </button> */}
        <button 
  onClick={() => navigate('/grading')} 
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
>
  Open AI Grading Queue
</button>
      </div>

      {message && (
        <div className={`px-4 py-2 rounded text-sm font-medium ${message.includes('✅') ? 'bg-green-100 text-green-700' : message.includes('⚠️') ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Create Exam Form */}
      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg shadow">
        <h3 className="font-bold text-yellow-800 mb-4">🛠️ Step 1: Create an Exam</h3>
        <form onSubmit={handleCreateExam} className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <input 
            required placeholder="Exam Name (e.g. CA 1)" 
            value={examForm.name} 
            onChange={e => setExamForm({...examForm, name: e.target.value})} 
            className="px-3 py-2 border border-yellow-300 rounded-md" 
          />
          <select 
            required value={examForm.classId} 
            onChange={e => setExamForm({...examForm, classId: e.target.value})} 
            className="px-3 py-2 border border-yellow-300 rounded-md"
          >
            <option value="">Select Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
          </select>
          <select 
            required value={examForm.termId} 
            onChange={e => setExamForm({...examForm, termId: e.target.value})} 
            className="px-3 py-2 border border-yellow-300 rounded-md"
          >
            <option value="">Select Term</option>
            {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select 
            required value={examForm.subjectId} 
            onChange={e => setExamForm({...examForm, subjectId: e.target.value})} 
            className="px-3 py-2 border border-yellow-300 rounded-md"
          >
            <option value="">Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input 
            required type="number" placeholder="Total Marks" 
            value={examForm.totalMarks} 
            onChange={e => setExamForm({...examForm, totalMarks: Number(e.target.value)})} 
            className="px-3 py-2 border border-yellow-300 rounded-md" 
          />
          
          <label className="flex items-center gap-2 md:col-span-6 cursor-pointer bg-white p-3 rounded-md border border-yellow-200 hover:bg-yellow-100 transition">
            <input 
              type="checkbox" 
              checked={examForm.isOnline} 
              onChange={e => setExamForm({...examForm, isOnline: e.target.checked})} 
              className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500"
            />
            <span className="text-yellow-900 font-semibold">
              This is an Online Exam (Enable auto-grading, timers, and question bank)
            </span>
          </label>

          <button 
            type="submit" 
            className="md:col-span-6 bg-yellow-600 text-white px-4 py-3 rounded-md hover:bg-yellow-700 transition font-semibold text-lg"
          >
            {examForm.isOnline ? '🚀 Create Online Exam & Add Questions' : 'Create Manual Exam'}
          </button>
        </form>
      </div>

      {/* Select Class and Exam */}
      <div className="bg-white p-6 rounded-lg shadow grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Select Class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.section}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Exam</label>
          <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Select Exam</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name} - {e.subject?.name} {e.isOnline && '🌐'} (Total: {e.totalMarks})</option>)}
          </select>
        </div>
      </div>

      {/* Gradebook Table */}
      {students.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
                <tr>
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3 text-center">MCQ Score <span className="text-xs text-gray-400 font-normal">(Auto/Manual)</span></th>
                  <th className="px-6 py-3 text-center">Theory Score <span className="text-xs text-gray-400 font-normal">(Auto/Manual)</span></th>
                  <th className="px-6 py-3 text-center">Total</th>
                  <th className="px-6 py-3 text-center">Grade</th>
                  <th className="px-6 py-3">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(student => (
                  <tr key={student.studentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{student.studentName}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="0"
                        defaultValue={student.mcqScore === 0 ? '' : student.mcqScore}
                        onBlur={e => handleScoreChange(student.studentId, 'mcqScore', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:border-blue-500 focus:outline-none"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="0"
                        defaultValue={student.theoryScore === 0 ? '' : student.theoryScore}
                        onBlur={e => handleScoreChange(student.studentId, 'theoryScore', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:border-blue-500 focus:outline-none"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-blue-600">
                      {student.marksObtained} / {student.totalMarks}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        student.grade === 'A' ? 'bg-green-100 text-green-700' :
                        student.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {student.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{student.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Question Manager Modal */}
      {showQuestionManager && createdOnlineExamId && (
        <BulkUploadQuestions
          examId={createdOnlineExamId}
          examName={createdOnlineExamName}
          authToken={getAuthToken()}
          onSuccess={() => {
            setShowQuestionManager(false);
            setSelectedClass(examForm.classId);
            api.get(`/grade/exams/class/${examForm.classId}`).then(res => setExams(res.data));
            setMessage('✅ Questions added successfully! Exam is ready for students.');
            setTimeout(() => setMessage(''), 3000);
          }}
          onCancel={() => {
            setShowQuestionManager(false);
            setMessage('⚠️ Exam created, but no questions added yet. You can add them later from the exam list.');
            setTimeout(() => setMessage(''), 4000);
          }}
        />
      )}
    </div>
  );
}