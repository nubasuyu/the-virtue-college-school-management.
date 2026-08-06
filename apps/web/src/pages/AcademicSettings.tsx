import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { ArrowLeft, Plus } from 'lucide-react';

export default function AcademicSettings() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Form States
  const [sessionForm, setSessionForm] = useState({ name: '', startDate: '', endDate: '' });
  const [termForm, setTermForm] = useState({ sessionId: '', name: '', number: 1, startDate: '', endDate: '' });

  const fetchData = async () => {
    try {
      const [sessionsRes, termsRes] = await Promise.all([
        api.get('/academic-session'),
        api.get('/term')
      ]);
      setSessions(sessionsRes.data);
      setTerms(termsRes.data);
      
      // Auto-select the first session for the term form if available
      if (sessionsRes.data.length > 0 && !termForm.sessionId) {
        setTermForm(prev => ({ ...prev, sessionId: sessionsRes.data[0].id }));
      }
    } catch (error) {
      console.error('Failed to fetch academic data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academic-session', sessionForm);
      setMessage('✅ Academic Session created successfully!');
      setSessionForm({ name: '', startDate: '', endDate: '' });
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Failed to create session.');
    }
  };

  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/term', termForm);
      setMessage('✅ Term created successfully!');
      setTermForm(prev => ({ ...prev, name: '', startDate: '', endDate: '' }));
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Failed to create term.');
    }
  };

  const toggleTermActive = async (termId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/term/${termId}/toggle-active`, { isActive: !currentStatus });
      setMessage('✅ Term status updated successfully!');
      fetchData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Failed to update term.');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* 👇 NAVIGATION HEADER WITH BACK BUTTON */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-[#5C4033] transition font-medium"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-[#5C4033]">Academic Settings</h1>
        <div className="w-24"></div> {/* Spacer for alignment */}
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium shadow-sm ${message.includes('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* ========================================== */}
      {/* 1. ACADEMIC SESSIONS */}
      {/* ========================================== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Academic Sessions</h2>
        </div>
        
        {/* Add Session Form */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <Plus size={16} /> Add New Session
          </h3>
          <form onSubmit={handleCreateSession} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Session Name</label>
              <input required placeholder="e.g., 2026-2027 Academic Year" value={sessionForm.name} onChange={e => setSessionForm({...sessionForm, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4033] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input required type="date" value={sessionForm.startDate} onChange={e => setSessionForm({...sessionForm, startDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4033] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
              <input required type="date" value={sessionForm.endDate} onChange={e => setSessionForm({...sessionForm, endDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4033] focus:border-transparent" />
            </div>
            <button type="submit" className="w-full bg-[#5C4033] text-[#FFFDD0] py-2 px-4 rounded-md hover:bg-[#4B3621] transition font-semibold">Create Session</button>
          </form>
        </div>

        {/* Sessions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
              <tr>
                <th className="px-6 py-3">Session Name</th>
                <th className="px-6 py-3">Start Date</th>
                <th className="px-6 py-3">End Date</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map(session => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{session.name}</td>
                  <td className="px-6 py-4">{new Date(session.startDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{new Date(session.endDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {session.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Active</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No sessions found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. TERMS */}
      {/* ========================================== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Terms</h2>
        </div>

        {/* Add Term Form */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <Plus size={16} /> Add New Term
          </h3>
          <form onSubmit={handleCreateTerm} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Session</label>
              <select required value={termForm.sessionId} onChange={e => setTermForm({...termForm, sessionId: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4033] focus:border-transparent">
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Term Name</label>
              <input required placeholder="e.g., First Term" value={termForm.name} onChange={e => setTermForm({...termForm, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4033] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Term Number</label>
              <input required type="number" min="1" value={termForm.number} onChange={e => setTermForm({...termForm, number: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4033] focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
              <input required type="date" value={termForm.startDate} onChange={e => setTermForm({...termForm, startDate: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4033] focus:border-transparent" />
            </div>
            <button type="submit" className="w-full bg-[#5C4033] text-[#FFFDD0] py-2 px-4 rounded-md hover:bg-[#4B3621] transition font-semibold">Create Term</button>
            
            <div className="md:col-span-5 mt-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Term End Date</label>
              <input required type="date" value={termForm.endDate} onChange={e => setTermForm({...termForm, endDate: e.target.value})} className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#5C4033] focus:border-transparent" />
            </div>
          </form>
        </div>

        {/* Terms Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
              <tr>
                <th className="px-6 py-3">Term Name</th>
                <th className="px-6 py-3">Session</th>
                <th className="px-6 py-3">Start Date</th>
                <th className="px-6 py-3">End Date</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {terms.map(term => (
                <tr key={term.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{term.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{term.session?.name || 'N/A'}</td>
                  <td className="px-6 py-4">{new Date(term.startDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{new Date(term.endDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleTermActive(term.id, term.isActive)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                        term.isActive 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {term.isActive ? 'Deactivate' : 'Set as Active'}
                    </button>
                  </td>
                </tr>
              ))}
              {terms.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No terms found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}