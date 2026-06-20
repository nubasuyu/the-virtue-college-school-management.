import { useState, useEffect } from 'react';
import api from '../lib/axios';

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassSaved: () => void;
  editClass?: any;
}

export default function AddClassModal({ isOpen, onClose, onClassSaved, editClass }: AddClassModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    classTeacherId: '',
  });

  useEffect(() => {
    if (isOpen) {
      // Fetch teachers to populate the dropdown
      api.get('/teacher').then(res => setTeachers(res.data)).catch(err => console.error(err));
      
      if (editClass) {
        setFormData({
          name: editClass.name,
          section: editClass.section,
          classTeacherId: editClass.classTeacherId || '',
        });
      } else {
        setFormData({ name: '', section: '', classTeacherId: '' });
      }
    }
  }, [isOpen, editClass]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // If no teacher is selected, send null
      const payload = { ...formData, classTeacherId: formData.classTeacherId || null };

      if (editClass) {
        await api.put(`/class/${editClass.id}`, payload);
      } else {
        await api.post('/class', payload);
      }
      
      onClassSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save class.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-xl font-bold text-gray-800">
            {editClass ? 'Edit Class' : 'Add New Class'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange}
                placeholder="e.g., Grade 10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
              <input required type="text" name="section" value={formData.section} onChange={handleChange}
                placeholder="e.g., A, B, or Blue"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign Class Teacher</label>
              <select name="classTeacherId" value={formData.classTeacherId} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">None (Unassigned)</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'Saving...' : (editClass ? 'Update Class' : 'Save Class')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}