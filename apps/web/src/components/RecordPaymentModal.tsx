import { useState, useEffect } from 'react';
import api from '../lib/axios';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSaved: () => void;
}

export default function RecordPaymentModal({ isOpen, onClose, onPaymentSaved }: RecordPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    studentId: '',
    feeStructureId: '',
    amount: '',
    reference: '', // Optional receipt number
  });

  useEffect(() => {
    if (isOpen) {
      // Fetch students and fees for the dropdowns
      Promise.all([
        api.get('/student'),
        api.get('/fees/structure')
      ]).then(([studentsRes, feesRes]) => {
        setStudents(studentsRes.data);
        setFees(feesRes.data);
      }).catch(err => console.error(err));

      // Reset form
      setFormData({ studentId: '', feeStructureId: '', amount: '', reference: '' });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // 👇 AUTO-FILL AMOUNT WHEN A FEE IS SELECTED 👇
    if (name === 'feeStructureId') {
      const selectedFee = fees.find(f => f.id === value);
      if (selectedFee) {
        setFormData(prev => ({ ...prev, feeStructureId: value, amount: selectedFee.amount.toString() }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/fees/payment', formData);
      onPaymentSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record payment.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Record New Payment</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Student *</label>
            <select required name="studentId" value={formData.studentId} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Choose a student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.admissionNo})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Fee Type *</label>
            <select required name="feeStructureId" value={formData.feeStructureId} onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Choose a fee...</option>
              {fees.map((f) => (
                <option key={f.id} value={f.id}>{f.name} (₦{f.amount.toLocaleString()})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid *</label>
            <input required type="number" name="amount" value={formData.amount} onChange={handleChange}
              placeholder="Auto-filled from fee"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-bold text-green-700" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt / Reference No.</label>
            <input type="text" name="reference" value={formData.reference} onChange={handleChange}
              placeholder="e.g., REC-90210 (Optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition disabled:opacity-50">
              {loading ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}