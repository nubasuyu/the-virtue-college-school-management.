import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { Clock, BookOpen, Play } from 'lucide-react';

export default function StudentExamsList() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* useEffect(() => {
    const fetchExams = async () => {
      try {
        // Fetch all exams (adjust endpoint if your backend uses a different path)
        const res = await api.get('/exams'); 
        // Filter to only show Online Exams that are active
        const onlineExams = res.data.filter((e: any) => e.isOnline === true);
        setExams(onlineExams);
      } catch (error) {
        console.error('Failed to fetch exams:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []); */

      useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await api.get('/exams'); 
        
        // 🔍 DEBUG: Let's see exactly what the backend is sending us!
        console.log('📦 RAW EXAMS DATA FROM BACKEND:', res.data);

        // ✅ Filter to ONLY show Online Exams
        const onlineExams = res.data.filter((e: any) => e.isOnline === true);
        console.log('✅ FILTERED ONLINE EXAMS:', onlineExams);
        
        setExams(onlineExams); 
        
      } catch (error) {
        console.error('Failed to fetch exams:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[#5C4033]">Loading available exams...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#4B3621]">Available Online Exams</h1>
        <p className="text-gray-600 mt-2">Select an exam below to begin. Good luck!</p>
      </div>

      {exams.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 p-8 rounded-lg text-center">
          <BookOpen className="mx-auto text-yellow-600 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-yellow-800">No Online Exams Available</h3>
          <p className="text-yellow-700 mt-2">Your teacher hasn't published any online exams for your class yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div key={exam.id} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
              <div className="bg-[#5C4033] p-4">
                <h3 className="text-lg font-bold text-[#FFFDD0] truncate">{exam.name}</h3>
                <p className="text-[#FFFDD0]/80 text-sm">{exam.subject?.name || 'General Subject'}</p>
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Clock size={16} className="text-[#5C4033]" />
                    <span>Duration: <strong>{exam.durationMins || 60} Minutes</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <BookOpen size={16} className="text-[#5C4033]" />
                    <span>Total Marks: <strong>{exam.totalMarks}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
    <span className={`px-2 py-1 rounded-full font-bold ${
      exam.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
    }`}>
      {exam.isOnline ? '🌐 Online Exam' : '📝 Manual Exam'}
    </span>
  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <span>Class: <strong>{exam.class?.name || 'All Classes'}</strong></span>
                  </div>
                </div>

                <Link 
                  to={`/exam/${exam.id}`}
                  className="w-full flex items-center justify-center gap-2 bg-[#5C4033] text-[#FFFDD0] py-3 rounded-lg font-bold hover:bg-[#4B3621] transition"
                >
                  <Play size={18} /> Start Exam
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}