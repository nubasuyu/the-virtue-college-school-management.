import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../lib/axios';

interface AddParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParentSaved: () => void;
  editParent?: any | null;
}

export default function AddParentModal({ isOpen, onClose, onParentSaved, editParent }: AddParentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', email: '', relation: 'Father',
  });
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Fetch all students so we can link them to this parent
      api.get('/student').then(res => setStudents(res.data || [])).catch(console.error);
      
      if (editParent) {
        setFormData({
          firstName: editParent.firstName || '',
          lastName: editParent.lastName || '',
          phone: editParent.phone || '',
          email: editParent.email || '',
          relation: editParent.studentParents?.[0]?.relation || 'Father',
        });
        // Pre-select students already linked to this parent
        const linkedIds = editParent.studentParents?.map((sp: any) => sp.studentId) || [];
        setSelectedStudentIds(linkedIds);
      } else {
        setFormData({ firstName: '', lastName: '', phone: '', email: '', relation: 'Father' });
        setSelectedStudentIds([]);
      }
    }
  }, [isOpen, editParent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        studentIds: selectedStudentIds,
        createPortalAccount: !!formData.email,
        password: 'parent123', // Default password for portal
      };

      if (editParent) {
        await api.patch(`/parents/${editParent.id}`, payload);
      } else {
        await api.post('/parents', payload);
      }
      
      onParentSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save parent.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-xl font-bold text-brown-800">
            {editParent ? 'Edit Parent/Guardian' : 'Add New Parent/Guardian'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">First Name *</label>
              <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brown-800" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name *</label>
              <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brown-800" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number *</label>
              <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brown-800" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email (Optional)</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brown-800" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Relationship *</label>
              <select name="relation" value={formData.relation} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brown-800">
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Legal Guardian</option>
              </select>
            </div>
          </div>

          {/* Link Students Section */}
          <div className="border-t pt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Link to Students (Check all that apply)</label>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
              {students.length === 0 ? (
                <p className="text-sm text-gray-500">No students found.</p>
              ) : (
                students.map((student) => (
                  <label key={student.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => toggleStudent(student.id)}
                      className="rounded text-brown-800 focus:ring-brown-800"
                    />
                    <span className="text-sm text-gray-700">
                      {student.firstName} {student.lastName} <span className="text-gray-400">({student.admissionNo})</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-white bg-brown-800 rounded-md hover:bg-brown-900 transition disabled:opacity-50">
              {loading ? 'Saving...' : (editParent ? 'Update Parent' : 'Save Parent')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}