import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { Clock, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Save } from 'lucide-react';

export default function StudentExamInterface() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // 1. Fetch Exam Data & Start Attempt on Load
  useEffect(() => {
    const loadExam = async () => {
      try {
        const res = await api.get(`/exams/${examId}`); 
        setExam(res.data);
        setQuestions(res.data.questions || []);
        setTimeLeft((res.data.durationMins || 60) * 60);

        const startRes = await api.post(`/exams/${examId}/start`);
        setAttemptId(startRes.data.id);
      } catch (error) {
        console.error('Failed to load exam:', error);
        alert('Could not load exam. Please try again.');
        navigate('/my-exams');
      }
    };
    if (examId) loadExam();
  }, [examId, navigate]);

  // 2. Countdown Timer Logic
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // 3. Auto-Save Logic (Debounced per question)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ FIX: Added 'type' parameter to correctly route the value
  const handleAnswerChange = (questionId: string, value: any, type: 'MCQ' | 'THEORY') => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], value, type },
    }));

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (!attemptId) return;
      try {
        const payload = {
          selectedOptionId: type === 'MCQ' ? value : null,
          submittedText: type === 'THEORY' ? value : null,
        };
        
        await api.patch(`/exams/attempts/${attemptId}/answers/${questionId}`, payload);
        setLastSaved(new Date());
      } catch (error) {
        console.warn('Auto-save failed:', error);
      }
    }, 800); // Reduced to 800ms for snappier feel
  };

  // ✅ FIX: Force save all pending answers before submitting
  const forceSaveAllAnswers = async () => {
    if (!attemptId) return;
    const savePromises = Object.entries(answers).map(async ([questionId, data]: [string, any]) => {
      try {
        const payload = {
          selectedOptionId: data.type === 'MCQ' ? data.value : null,
          submittedText: data.type === 'THEORY' ? data.value : null,
        };
        await api.patch(`/exams/attempts/${attemptId}/answers/${questionId}`, payload);
      } catch (error) {
        console.warn('Final save failed for', questionId, error);
      }
    });
    await Promise.all(savePromises);
  };

  // 4. Anti-Cheat: Tab Switch Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setTabSwitchCount((prev) => prev + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Submit Exam
  const handleSubmitExam = async () => {
    if (isSubmitting || !attemptId) return;
    if (!window.confirm('Are you sure you want to submit? You cannot change your answers after submission.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      // ✅ FIX: Wait for all pending auto-saves to finish before submitting
      await forceSaveAllAnswers();
      
      // Call the backend submit endpoint
      await api.post(`/exams/attempts/${attemptId}/submit`);
      alert('Exam submitted successfully!');
      navigate('/my-exams'); 
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Failed to submit exam. Please check your internet connection.');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!exam || !questions.length || !attemptId) {
    return <div className="flex items-center justify-center h-screen text-[#5C4033] text-xl font-semibold">Loading Exam & Starting Session...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isAnswered = (qId: string) => !!answers[qId]?.value;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER */}
      <header className="bg-[#5C4033] text-[#FFFDD0] px-6 py-4 shadow-md flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold">{exam.name}</h1>
          <p className="text-sm opacity-90">{exam.subject?.name} • Total Marks: {exam.totalMarks}</p>
        </div>
        
        <div className="flex items-center gap-6">
          {tabSwitchCount > 0 && (
            <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
              <AlertTriangle size={16} />
              Tab switched {tabSwitchCount} time(s)!
            </div>
          )}

          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl font-bold ${
            timeLeft < 300 ? 'bg-red-600 text-white animate-pulse' : 'bg-[#FFFDD0] text-[#5C4033]'
          }`}>
            <Clock size={24} />
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full p-4 gap-6">
        
        {/* LEFT: Question Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm p-6 md:p-8 flex flex-col">
          <div className="mb-6">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Question {currentQuestionIndex + 1} of {questions.length} • {currentQuestion.maxPoints} Marks
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mt-2 leading-relaxed">
              {currentQuestion.questionText}
            </h2>
          </div>

          <div className="flex-1 space-y-4">
            {currentQuestion.type === 'MCQ' && currentQuestion.options?.map((opt: any) => (
              <label 
                key={opt.id} 
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  answers[currentQuestion.id]?.value === opt.id 
                    ? 'border-[#5C4033] bg-[#FFFDD0]/30' 
                    : 'border-gray-200 hover:border-[#5C4033]/50 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name={`q-${currentQuestion.id}`}
                  value={opt.id}
                  checked={answers[currentQuestion.id]?.value === opt.id}
                  onChange={() => handleAnswerChange(currentQuestion.id, opt.id, 'MCQ')}
                  className="w-5 h-5 text-[#5C4033] focus:ring-[#5C4033]"
                />
                <span className="text-gray-800 text-lg">{opt.optionText}</span>
              </label>
            ))}

            {currentQuestion.type === 'THEORY' && (
              <textarea
                value={answers[currentQuestion.id]?.value || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value, 'THEORY')}
                placeholder="Type your answer here..."
                className="w-full h-64 p-4 border-2 border-gray-200 rounded-lg focus:border-[#5C4033] focus:ring-0 resize-none text-gray-800 text-lg leading-relaxed"
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} /> Previous
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              {lastSaved && <><Save size={14} /> Saved {lastSaved.toLocaleTimeString()}</>}
            </div>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="flex items-center gap-2 px-6 py-3 bg-[#5C4033] text-[#FFFDD0] font-semibold rounded-lg hover:bg-[#4B3621] transition"
              >
                Next <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: Question Palette Sidebar */}
        <div className="w-full md:w-80 bg-white rounded-xl shadow-sm p-6 h-fit sticky top-24">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-[#5C4033]" /> Question Palette
          </h3>
          
          <div className="grid grid-cols-5 gap-2 mb-6">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              const isAns = isAnswered(q.id);
              
              let bgClass = 'bg-gray-100 text-gray-600 border-gray-200';
              if (isCurrent) bgClass = 'bg-[#5C4033] text-[#FFFDD0] border-[#5C4033] ring-2 ring-[#FFFDD0]';
              else if (isAns) bgClass = 'bg-green-100 text-green-700 border-green-300';

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm border-2 transition-all ${bgClass} ${
                    !isCurrent && 'hover:border-[#5C4033]'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="space-y-2 text-sm text-gray-600 border-t pt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#5C4033]"></div> Current
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div> Answered
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div> Unanswered
            </div>
          </div>

          <button
            onClick={handleSubmitExam}
            className="w-full mt-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
          >
            Submit Exam
          </button>
        </div>
      </main>
    </div>
  );
}