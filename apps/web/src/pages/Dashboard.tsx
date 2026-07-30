import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { CheckCircle, AlertTriangle, Edit2, Save } from 'lucide-react';

export default function TeacherGradingDashboard() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState(examId || '');
  const [pendingGrades, setPendingGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<number>(0);
  const [editFeedback, setEditFeedback] = useState('');
  const [message, setMessage] = useState('');

  // 1. Fetch all exams for the dropdown
  useEffect(() => {
    api.get('/exams')
      .then(res => setExams(res.data))
      .catch(console.error);
  }, []);

  // 2. Fetch pending grades when exam is selected
  useEffect(() => {
    if (selectedExamId) {
      fetchPendingGrades(selectedExamId);
    } else {
      setLoading(false);
    }
  }, [selectedExamId]);

  const fetchPendingGrades = async (eId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/exams/${eId}/grading/pending`);
      setPendingGrades(res.data);
    } catch (error) {
      console.error('Failed to fetch pending grades:', error);
      setMessage(' Failed to load pending grades.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (logId: string, useAiScore: boolean) => {
    try {
      const payload = {
        status: 'APPROVED',
        teacherFinalScore: useAiScore ? undefined : editScore,
        teacherFinalFeedback: useAiScore ? undefined : editFeedback,
      };

      await api.put(`/exams/grading/logs/${logId}`, payload);
      setMessage('✅ Grade approved and synced to Gradebook!');
      setEditingLogId(null);
      fetchPendingGrades(selectedExamId);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to approve grade:', error);
      setMessage('❌ Failed to approve grade.');
    }
  };

  const handleFlag = async (logId: string) => {
    try {
      await api.put(`/exams/grading/logs/${logId}`, {
        status: 'FLAGGED',
        teacherFinalScore: editScore,
        teacherFinalFeedback: editFeedback,
      });
      setMessage('⚠️ Grade flagged for review.');
      setEditingLogId(null);
      fetchPendingGrades(selectedExamId);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to flag grade:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-brown-800">AI Grading Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">Review and approve AI-suggested scores for theory answers.</p>
        </div>
        <button 
          onClick={() => navigate('/gradebook')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          ← Back to Gradebook
        </button>
      </div>

      {/* Exam Selector Dropdown */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
        <label className="font-semibold text-gray-700">Select Exam:</label>
        <select 
          value={selectedExamId} 
          onChange={(e) => setSelectedExamId(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Choose an Exam --</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.name} - {exam.subject?.name} ({exam.class?.name})
            </option>
          ))}
        </select>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          message.includes('✅') ? 'bg-green-100 text-green-700' : 
          message.includes('⚠️') ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-600">Loading AI Grading Queue...</div>
      ) : pendingGrades.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-800">All Caught Up!</h3>
          <p className="text-gray-500 mt-2">
            {selectedExamId ? 'There are no pending theory answers to grade for this exam.' : 'Please select an exam above to view pending grades.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingGrades.map((log) => {
            const student = log.studentAnswer.attempt.student;
            const question = log.studentAnswer.question;
            const isEditing = editingLogId === log.id;

            return (
              <div key={log.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-800">
                      {student.firstName} {student.lastName} 
                      <span className="text-gray-500 font-normal text-sm ml-2">({student.admissionNo})</span>
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Question: {question.questionText}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Max Points</span>
                    <p className="text-xl font-bold text-brown-800">{question.maxPoints}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                  <div className="p-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                      <Edit2 size={16} /> Student's Answer
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-800 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                      {log.studentAnswer.submittedText || <span className="text-gray-400 italic">No text submitted.</span>}
                    </div>
                  </div>

                  <div className="p-6 bg-blue-50/30">
                    <h4 className="text-sm font-semibold text-blue-800 uppercase mb-3 flex items-center gap-2">
                      <CheckCircle size={16} /> AI Suggestion
                    </h4>
                    
                    {!isEditing ? (
                      <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-blue-700">{log.aiSuggestedScore}</span>
                          <span className="text-gray-500">/ {question.maxPoints} points</span>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-100 text-sm text-gray-700">
                          <span className="font-semibold text-blue-800">AI Feedback:</span> {log.aiFeedback}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <AlertTriangle size={14} />
                          Confidence: {Math.round((log.aiConfidence || 0) * 100)}%
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => handleApprove(log.id, true)}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={18} /> Approve
                          </button>
                          <button
                            onClick={() => {
                              setEditingLogId(log.id);
                              setEditScore(log.aiSuggestedScore);
                              setEditFeedback(log.aiFeedback);
                            }}
                            className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2"
                          >
                            <Edit2 size={18} /> Edit Score
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Adjusted Score</label>
                          <input
                            type="number"
                            min="0"
                            max={question.maxPoints}
                            value={editScore}
                            onChange={(e) => setEditScore(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Feedback</label>
                          <textarea
                            value={editFeedback}
                            onChange={(e) => setEditFeedback(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => handleApprove(log.id, false)}
                            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                          >
                            <Save size={18} /> Save & Approve
                          </button>
                          <button
                            onClick={() => handleFlag(log.id)}
                            className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition font-medium flex items-center justify-center gap-2"
                          >
                            <AlertTriangle size={18} /> Flag
                          </button>
                          <button
                            onClick={() => setEditingLogId(null)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}