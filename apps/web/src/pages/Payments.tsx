import { useEffect, useState } from 'react';
import api from '../lib/axios';
import RecordPaymentModal from '../components/RecordPaymentModal';

interface Payment {
  id: string;
  amount: number;
  createdAt: string;
  reference?: string;
  student?: { firstName: string; lastName: string; admissionNo: string };
  feeStructure?: { name: string };
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/fees/payment');
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  if (loading) return <div className="p-4 text-gray-600">Loading payments...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Payment Records</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Record Payment
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-gray-50 text-gray-600">
            <tr>
              <th scope="col" className="px-6 py-4">Date</th>
              <th scope="col" className="px-6 py-4">Student</th>
              <th scope="col" className="px-6 py-4">Fee Type</th>
              <th scope="col" className="px-6 py-4">Reference</th>
              <th scope="col" className="px-6 py-4">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No payments recorded yet. Click "Record Payment" to add one!
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {payment.student ? `${payment.student.firstName} ${payment.student.lastName}` : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {payment.feeStructure?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">
                    {payment.reference || '-'}
                  </td>
                  <td className="px-6 py-4 font-mono text-green-600 font-bold text-lg">
                    ₦{payment.amount.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <RecordPaymentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onPaymentSaved={fetchPayments} 
      />
    </div>
  );
}