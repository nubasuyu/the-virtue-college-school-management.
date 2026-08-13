import { useState, useEffect } from 'react';
import { X, CheckCircle, DollarSign } from 'lucide-react';
import api from '../lib/axios';

interface ManageStudentFeesProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  onFeesUpdated: () => void;
}

export default function ManageStudentFees({ isOpen, onClose, studentId, studentName, onFeesUpdated }: ManageStudentFeesProps) {
  const [fees, setFees] = useState<any[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) fetchFees();
  }, [isOpen, studentId]);

  const fetchFees = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/fees/student/${studentId}/breakdown`);
      setFees(res.data.breakdown || []);
      setTotalDue(res.data.totalDue || 0);
    } catch (err) {
      console.error('Failed to fetch fees', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (feeId: string, isCurrentlyActive: boolean) => {
    try {
      await api.post(`/fees/student/${studentId}/fee/${feeId}/toggle`, {
        isActive: !isCurrentlyActive
      });
      fetchFees(); // Refresh data to show updated totals
      onFeesUpdated();
    } catch (err) {
      alert('Failed to update fee.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-xl font-bold text-brown-800">Manage Fees: {studentName}</h3>
            <p className="text-sm text-gray-500">Toggle any fee on (Apply) or off (Waive) for this student.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brown-800"></div>
              Loading fee breakdown...
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {fees.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No fees assigned to this student's class yet.</p>
                ) : (
                  fees.map((fee: any) => {
                    const isActive = fee.isActive; // 👈 Unified active state
                    
                    return (
                      <div key={fee.id} className={`flex items-center justify-between p-4 rounded-lg border ${isActive ? 'bg-cream-50 border-brown-800/30' : 'bg-gray-50 border-gray-200 opacity-75'}`}>
                        <div className="flex items-center gap-3">
                          {/* 👇 EVERY FEE GETS A TOGGLE BUTTON NOW */}
                          <button 
                            onClick={() => handleToggle(fee.id, isActive)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${isActive ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white'}`}
                          >
                            {isActive && <CheckCircle className="w-4 h-4 text-white" />}
                          </button>
                          <div>
                            <p className="font-semibold text-gray-800">{fee.name}</p>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              {fee.category} {fee.isOptional && <span className="text-blue-600 font-medium">(Optional)</span>}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-bold text-lg ${isActive ? 'text-brown-800' : 'text-gray-400 line-through'}`}>
                            ₦{fee.finalAmount.toLocaleString()}
                          </p>
                          <button 
                            onClick={() => handleToggle(fee.id, isActive)}
                            className={`text-xs font-medium mt-1 ${isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                          >
                            {isActive ? 'Waive Fee' : 'Apply Fee'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t pt-4 flex justify-between items-center bg-brown-800 text-cream-50 p-4 rounded-lg shadow-md">
                <span className="font-bold text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5" /> Total Amount Due:
                </span>
                <span className="font-bold text-2xl">₦{totalDue.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-brown-800 text-cream-50 rounded-lg hover:bg-brown-900 transition font-medium">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}