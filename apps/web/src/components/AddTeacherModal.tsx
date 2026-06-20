import { useState, useEffect } from 'react';
import api from '../lib/axios';

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeacherSaved: () => void;
  editTeacher?: any;
}

export default function AddTeacherModal({ isOpen, onClose, onTeacherSaved, editTeacher }: AddTeacherModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '', // 👈 NEW: Added password field
    phone: '',
    subject: '',
    qualification: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (editTeacher) {
        setFormData({
          firstName: editTeacher.firstName,
          lastName: editTeacher.lastName,
          email: editTeacher.email,
          password: '', // Leave blank when editing for security
          phone: editTeacher.phone || '',
          subject: editTeacher.subject || '',
          qualification: editTeacher.qualification || '',
        });
      } else {
        setFormData({ 
          firstName: '', lastName: '', email: '', password: '', phone: '', subject: '', qualification: '' 
        });
      }
    }
  }, [isOpen, editTeacher]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = { ...formData };
      
      // If editing and password is empty, remove it so we don't send an empty password
      if (editTeacher && !payload.password) {
        delete payload.password;
      }

      if (editTeacher) {
        await api.put(`/teacher/${editTeacher.id}`, payload);
      } else {
        await api.post('/teacher', payload);
      }
      
      onTeacherSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save teacher.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-xl font-bold text-gray-800">
            {editTeacher ? 'Edit Teacher' : 'Add New Teacher'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input required type="email" name="email" value={formData.email} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {/* 👇 NEW: PASSWORD FIELD 👇 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {editTeacher ? '(Leave blank to keep current)' : '*'}
              </label>
              <input 
                required={!editTeacher} 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject Taught</label>
              <input type="text" name="subject" value={formData.subject} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
              <input type="text" name="qualification" value={formData.qualification} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'Saving...' : (editTeacher ? 'Update Teacher' : 'Save Teacher')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}