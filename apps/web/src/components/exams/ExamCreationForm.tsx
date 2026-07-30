'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Save, CheckCircle, AlertCircle } from 'lucide-react';

// --- Types ---
type QuestionType = 'MCQ' | 'THEORY';

interface Option {
  optionText: string;
  isCorrect: boolean;
}

interface RubricCriteria {
  concept: string;
  points: number;
}

interface Question {
  type: QuestionType;
  questionText: string;
  maxPoints: number;
  options?: Option[];
  rubric?: {
    modelAnswer: string;
    gradingCriteria: RubricCriteria[];
  };
}

// --- Mock Data for Dropdowns (Replace with actual API calls later) ---
const MOCK_SUBJECTS = [{ id: 'sub-1', name: 'Mathematics' }, { id: 'sub-2', name: 'English' }];
const MOCK_CLASSES = [{ id: 'cls-1', name: 'Grade 10A' }, { id: 'cls-2', name: 'Grade 11B' }];
const MOCK_TERMS = [{ id: 'term-1', name: 'Term 1' }, { id: 'term-2', name: 'Term 2' }];

export default function ExamCreationForm() {
  // --- State: Exam Details ---
  const [examDetails, setExamDetails] = useState({
    name: '',
    assessmentType: 'Mid-Term',
    subjectId: MOCK_SUBJECTS[0].id,
    classId: MOCK_CLASSES[0].id,
    termId: MOCK_TERMS[0].id,
    date: new Date().toISOString().split('T')[0],
    totalMarks: 100,
    isOnline: true,
    durationMins: 60,
    shuffleOptions: false,
  });

  // --- State: Questions ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  
  // --- State: New Question Form ---
  const [newQ, setNewQ] = useState<Question>({
    type: 'MCQ',
    questionText: '',
    maxPoints: 5,
    options: [{ optionText: '', isCorrect: false }, { optionText: '', isCorrect: false }],
    rubric: { modelAnswer: '', gradingCriteria: [{ concept: '', points: 0 }] },
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- Handlers: Exam Details ---
  const handleExamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setExamDetails((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // --- Handlers: Question Builder ---
  const handleNewQChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewQ((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index: number, field: keyof Option, value: string | boolean) => {
    const updatedOptions = [...(newQ.options || [])];
    updatedOptions[index] = { ...updatedOptions[index], [field]: value };
    
    // Ensure only one option is marked correct
    if (field === 'isCorrect' && value === true) {
      updatedOptions.forEach((opt, i) => {
        if (i !== index) opt.isCorrect = false;
      });
    }
    setNewQ((prev) => ({ ...prev, options: updatedOptions }));
  };

  const addOption = () => {
    setNewQ((prev) => ({
      ...prev,
      options: [...(prev.options || []), { optionText: '', isCorrect: false }],
    }));
  };

  const removeOption = (index: number) => {
    setNewQ((prev) => ({
      ...prev,
      options: (prev.options || []).filter((_, i) => i !== index),
    }));
  };

  const handleCriteriaChange = (index: number, field: keyof RubricCriteria, value: string | number) => {
    const updatedCriteria = [...(newQ.rubric?.gradingCriteria || [])];
    updatedCriteria[index] = { ...updatedCriteria[index], [field]: value };
    setNewQ((prev) => ({
      ...prev,
      rubric: { ...prev.rubric!, gradingCriteria: updatedCriteria },
    }));
  };

  const addCriteria = () => {
    setNewQ((prev) => ({
      ...prev,
      rubric: {
        ...prev.rubric!,
        gradingCriteria: [...(prev.rubric?.gradingCriteria || []), { concept: '', points: 0 }],
      },
    }));
  };

  const removeCriteria = (index: number) => {
    setNewQ((prev) => ({
      ...prev,
      rubric: {
        ...prev.rubric!,
        gradingCriteria: (prev.rubric?.gradingCriteria || []).filter((_, i) => i !== index),
      },
    }));
  };

  const saveQuestion = () => {
    if (!newQ.questionText || newQ.maxPoints <= 0) {
      alert('Please provide question text and valid max points.');
      return;
    }
    setQuestions((prev) => [...prev, newQ]);
    setIsAddingQuestion(false);
    // Reset new question form
    setNewQ({
      type: 'MCQ',
      questionText: '',
      maxPoints: 5,
      options: [{ optionText: '', isCorrect: false }, { optionText: '', isCorrect: false }],
      rubric: { modelAnswer: '', gradingCriteria: [{ concept: '', points: 0 }] },
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Handlers: Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questions.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one question.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // 1. Create the Exam
      // NOTE: Replace '/api/exams' with your actual backend URL and add auth headers (e.g., Bearer token)
      // Get token from localStorage (adjust based on how your app stores it)
const token = localStorage.getItem('authToken'); // or sessionStorage, or your auth context

const examRes = await fetch('/api/exams', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(examDetails),
});

      if (!examRes.ok) throw new Error('Failed to create exam');
      const examData = await examRes.json();
      const examId = examData.id;

      // 2. Add all questions sequentially
      // 2. Add all questions sequentially
for (const q of questions) {
  const qRes = await fetch(`/api/exams/${examId}/questions`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`  // ← Add this line
    },
    body: JSON.stringify(q),
  });
  if (!qRes.ok) throw new Error(`Failed to add question: ${q.questionText}`);
}

      setMessage({ type: 'success', text: 'Exam created and published successfully!' });
      // Optional: Reset form or redirect
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#FFFDD0] p-6 md:p-12 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4B3621] mb-2">Create New Exam</h1>
        <p className="text-[#5C4033] mb-8">Design your online assessment, add questions, and set grading rubrics.</p>

        {message && (
          <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* --- SECTION 1: Exam Details --- */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#5C4033]/20">
            <h2 className="text-xl font-semibold text-[#4B3621] mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-[#5C4033] rounded-full"></span>
              Exam Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="name" placeholder="Exam Name (e.g., Mid-Term Mathematics)" value={examDetails.name} onChange={handleExamChange} required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C4033] outline-none" />
              <select name="assessmentType" value={examDetails.assessmentType} onChange={handleExamChange} className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C4033] outline-none">
                <option>Mid-Term</option>
                <option>Final</option>
                <option>Quiz</option>
                <option>Mock</option>
              </select>
              <select name="subjectId" value={examDetails.subjectId} onChange={handleExamChange} className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C4033] outline-none">
                {MOCK_SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select name="classId" value={examDetails.classId} onChange={handleExamChange} className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C4033] outline-none">
                {MOCK_CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select name="termId" value={examDetails.termId} onChange={handleExamChange} className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C4033] outline-none">
                {MOCK_TERMS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input type="date" name="date" value={examDetails.date} onChange={handleExamChange} required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C4033] outline-none" />
              <input type="number" name="totalMarks" placeholder="Total Marks" value={examDetails.totalMarks} onChange={handleExamChange} required className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C4033] outline-none" />
              
              {/* Online Specific Settings */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="isOnline" checked={examDetails.isOnline} onChange={handleExamChange} className="w-5 h-5 text-[#5C4033] rounded focus:ring-[#5C4033]" />
                  <span className="text-[#4B3621] font-medium">Online Exam</span>
                </label>
                {examDetails.isOnline && (
                  <>
                    <input type="number" name="durationMins" placeholder="Duration (mins)" value={examDetails.durationMins} onChange={handleExamChange} className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C4033] outline-none" />
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="shuffleOptions" checked={examDetails.shuffleOptions} onChange={handleExamChange} className="w-5 h-5 text-[#5C4033] rounded focus:ring-[#5C4033]" />
                      <span className="text-[#4B3621]">Shuffle MCQ Options</span>
                    </label>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* --- SECTION 2: Questions Builder --- */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#5C4033]/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#4B3621] flex items-center gap-2">
                <span className="w-2 h-6 bg-[#5C4033] rounded-full"></span>
                Questions ({questions.length})
              </h2>
              {!isAddingQuestion && (
                <button type="button" onClick={() => setIsAddingQuestion(true)} className="flex items-center gap-2 bg-[#5C4033] text-[#FFFDD0] px-4 py-2 rounded-lg hover:bg-[#4B3621] transition">
                  <Plus size={18} /> Add Question
                </button>
              )}
            </div>

            {/* Question List */}
            <div className="space-y-3 mb-6">
              {questions.map((q, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-[#FFFDD0]/50 border border-[#5C4033]/20 rounded-lg">
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${q.type === 'MCQ' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {q.type}
                    </span>
                    <span className="ml-3 text-[#4B3621] font-medium">{q.questionText.substring(0, 60)}...</span>
                    <span className="ml-2 text-sm text-gray-500">({q.maxPoints} pts)</span>
                  </div>
                  <button type="button" onClick={() => removeQuestion(idx)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Question Form (Inline) */}
            {isAddingQuestion && (
              <div className="p-6 bg-gray-50 border-2 border-dashed border-[#5C4033]/30 rounded-xl space-y-4">
                <div className="flex gap-4 mb-4">
                  <button type="button" onClick={() => setNewQ({ ...newQ, type: 'MCQ' })} className={`px-4 py-2 rounded-lg font-medium ${newQ.type === 'MCQ' ? 'bg-[#5C4033] text-[#FFFDD0]' : 'bg-gray-200 text-gray-700'}`}>Multiple Choice</button>
                  <button type="button" onClick={() => setNewQ({ ...newQ, type: 'THEORY' })} className={`px-4 py-2 rounded-lg font-medium ${newQ.type === 'THEORY' ? 'bg-[#5C4033] text-[#FFFDD0]' : 'bg-gray-200 text-gray-700'}`}>Theory / Essay</button>
                </div>

                <textarea name="questionText" placeholder="Enter question text..." value={newQ.questionText} onChange={handleNewQChange} rows={3} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C4033] outline-none" />
                
                <div className="flex items-center gap-4">
                  <label className="text-[#4B3621] font-medium">Max Points:</label>
                  <input type="number" name="maxPoints" value={newQ.maxPoints} onChange={handleNewQChange} className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C4033] outline-none" />
                </div>

                {/* MCQ Options */}
                {newQ.type === 'MCQ' && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-[#4B3621]">Options (Select the correct one):</p>
                    {newQ.options?.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input type="radio" name={`correct-opt-${idx}`} checked={opt.isCorrect} onChange={() => handleOptionChange(idx, 'isCorrect', true)} className="w-5 h-5 text-[#5C4033]" />
                        <input type="text" placeholder={`Option ${idx + 1}`} value={opt.optionText} onChange={(e) => handleOptionChange(idx, 'optionText', e.target.value)} className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C4033] outline-none" />
                        {newQ.options!.length > 2 && (
                          <button type="button" onClick={() => removeOption(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addOption} className="text-sm text-[#5C4033] font-medium hover:underline flex items-center gap-1"><Plus size={14} /> Add Option</button>
                  </div>
                )}

                {/* Theory Rubric */}
                {newQ.type === 'THEORY' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-[#4B3621] mb-1">Model Answer:</p>
                      <textarea name="modelAnswer" placeholder="Ideal answer for reference..." value={newQ.rubric?.modelAnswer} onChange={(e) => setNewQ({ ...newQ, rubric: { ...newQ.rubric!, modelAnswer: e.target.value } })} rows={3} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C4033] outline-none" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#4B3621] mb-2">Grading Criteria (AI will use this to score):</p>
                      {newQ.rubric?.gradingCriteria.map((crit, idx) => (
                        <div key={idx} className="flex items-center gap-3 mb-2">
                          <input type="text" placeholder="Concept/Keyword (e.g., Mentions photosynthesis)" value={crit.concept} onChange={(e) => handleCriteriaChange(idx, 'concept', e.target.value)} className="flex-[3] p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C4033] outline-none" />
                          <input type="number" placeholder="Pts" value={crit.points} onChange={(e) => handleCriteriaChange(idx, 'points', Number(e.target.value))} className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C4033] outline-none" />
                          {newQ.rubric!.gradingCriteria.length > 1 && (
                            <button type="button" onClick={() => removeCriteria(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={addCriteria} className="text-sm text-[#5C4033] font-medium hover:underline flex items-center gap-1"><Plus size={14} /> Add Criteria</button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => setIsAddingQuestion(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="button" onClick={saveQuestion} className="px-6 py-2 bg-[#5C4033] text-[#FFFDD0] rounded-lg hover:bg-[#4B3621] transition font-medium">Save Question</button>
                </div>
              </div>
            )}
          </div>

          {/* --- SECTION 3: Submit --- */}
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={loading || questions.length === 0}
              className="flex items-center gap-2 bg-[#5C4033] text-[#FFFDD0] px-8 py-3 rounded-lg hover:bg-[#4B3621] transition disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold shadow-md"
            >
              {loading ? 'Publishing...' : <><Save size={20} /> Publish Exam</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}