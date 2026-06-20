import { useState, useEffect } from 'react';
import api from '../lib/axios';

interface AddFeeStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFeeSaved: () => void;
  editFee?: any;
}

export default function AddFeeStructureModal({ isOpen, onClose, onFeeSaved, editFee }: AddFeeStructureModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    classId: '',
  });

  useEffect(() => {
    if (isOpen) {
      api.get('/class').then(res => setClasses(res.data)).catch(err => console.error(err));
      
      if (editFee) {
        setFormData({
          name: editFee.name,
          amount: editFee.amount.toString(),
          classId: editFee.classId,
        });
      } else {
        setFormData({ name: '', amount: '', classId: '' });
      }
    }
  }, [isOpen, editFee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount), // Convert string to number for backend
      };

      if (editFee) {
        await api.put(`/fees/structure/${editFee.id}`, payload);
      } else {
        await api.post('/fees/structure', payload);
      }
      
      onFeeSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save fee structure.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            {editFee ? 'Edit Fee Structure' : 'Add New Fee Structure'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fee Name *</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange}
              placeholder="e.g., Tuition, Library Fee, Lab Fee"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
            <input required type="number" name="amount" value={formData.amount} onChange={handleChange}
              placeholder="e.g., 50000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Applicable Class *</label>
            <select required name="classId" value={formData.classId} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name} - {cls.section}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'Saving...' : (editFee ? 'Update Fee' : 'Save Fee')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}