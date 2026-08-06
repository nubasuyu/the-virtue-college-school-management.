import { useEffect, useState } from 'react';
import api from '../lib/axios';
import AddFeeStructureModal from '../components/AddFeeStructureModal';
import { CheckCircle, Calendar, FileText } from 'lucide-react';

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  classId: string;
  class?: { name: string; section: string };
  term?: { name: string };
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
  feeStructure?: FeeStructure;
}

interface FeeSummary {
  student: { id: string; name: string; admissionNo: string };
  feeStructures: FeeStructure[];
  payments: Payment[];
  summary: { totalExpected: number; totalPaid: number; balance: number };
}

export default function Fees() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role;

  // --- ADMIN / ACCOUNTANT STATE ---
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editFee, setEditFee] = useState<any>(null);

  // --- PARENT STATE ---
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [loadingParent, setLoadingParent] = useState(true);

  // ==========================================
  // FETCH DATA BASED ON ROLE
  // ==========================================
  useEffect(() => {
    if (role === 'PARENT') {
      fetchParentFees();
    } else {
      fetchAdminFees();
    }
  }, [role]);

  const fetchAdminFees = async () => {
    try {
      const response = await api.get('/fees/structure');
      setFees(response.data);
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoadingAdmin(false);
    }
  };

  const fetchParentFees = async () => {
    setLoadingParent(true);
    try {
      // 👇 DYNAMICALLY get the first child's ID from the user object
      const studentId = user?.children?.[0]?.id;
      
      if (!studentId) {
        // Fallback if no children are linked to the parent account yet
        setFeeSummary({
          student: { id: '', name: 'No children linked', admissionNo: 'N/A' },
          feeStructures: [],
          payments: [],
          summary: { totalExpected: 0, totalPaid: 0, balance: 0 }
        });
        setLoadingParent(false);
        return;
      }

      const res = await api.get(`/fees/student/${studentId}/summary`);
      setFeeSummary(res.data);
    } catch (error) {
      console.error('Error fetching parent fees:', error);
    } finally {
      setLoadingParent(false);
    }
  };

  // ==========================================
  // ADMIN ACTIONS
  // ==========================================
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete fee structure ${name}?`)) {
      try {
        await api.delete(`/fees/structure/${id}`);
        fetchAdminFees();
      } catch (error) {
        alert('Failed to delete fee structure.');
      }
    }
  };

  const handleEdit = (fee: any) => {
    setEditFee(fee);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditFee(null);
    setIsModalOpen(false);
  };

  // ==========================================
  // RENDER: PARENT VIEW (Stunning & Presentation Ready - READ ONLY)
  // ==========================================
  if (role === 'PARENT') {
    if (loadingParent) return <div className="p-8 text-center text-gray-600">Loading fee details...</div>;

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#5C4033]">Fee Management</h1>
            <p className="text-gray-600 text-sm">
              View fee breakdown and payment history for <strong>{feeSummary?.student.name}</strong>
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium mb-1">Total Expected Fees</p>
            <p className="text-3xl font-bold text-gray-800">₦{(feeSummary?.summary.totalExpected || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500 font-medium mb-1">Total Amount Paid</p>
            <p className="text-3xl font-bold text-green-600">₦{(feeSummary?.summary.totalPaid || 0).toLocaleString()}</p>
          </div>
          <div className={`p-6 rounded-xl shadow-sm border ${feeSummary?.summary.balance === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm font-medium mb-1 ${feeSummary?.summary.balance === 0 ? 'text-green-700' : 'text-red-700'}`}>
              Outstanding Balance
            </p>
            <p className={`text-3xl font-bold ${feeSummary?.summary.balance === 0 ? 'text-green-700' : 'text-red-700'}`}>
              ₦{(feeSummary?.summary.balance || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fee Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <FileText size={20} className="text-[#5C4033]" />
              <h3 className="font-bold text-gray-800">Fee Breakdown</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {feeSummary?.feeStructures.length === 0 ? (
                <p className="p-6 text-center text-gray-500">No fees assigned to this class yet.</p>
              ) : (
                feeSummary?.feeStructures.map((fee) => (
                  <div key={fee.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                    <div>
                      <p className="font-semibold text-gray-800">{fee.name}</p>
                      <p className="text-xs text-gray-500">{fee.term?.name || 'All Terms'} • {fee.class?.name || 'All Classes'}</p>
                    </div>
                    <p className="font-bold text-gray-800">₦{fee.amount.toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <Calendar size={20} className="text-[#5C4033]" />
              <h3 className="font-bold text-gray-800">Payment History</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {feeSummary?.payments.length === 0 ? (
                <p className="p-6 text-center text-gray-500">No payments recorded yet.</p>
              ) : (
                feeSummary?.payments.map((payment) => (
                  <div key={payment.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{payment.feeStructure?.name || 'General Payment'}</p>
                        <p className="text-xs text-gray-500">{new Date(payment.paymentDate).toLocaleDateString()} • {payment.paymentMethod}</p>
                      </div>
                    </div>
                    <p className="font-bold text-green-600">+₦{payment.amount.toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: ADMIN / ACCOUNTANT VIEW (Original Logic)
  // ==========================================
  if (loadingAdmin) return <div className="p-8 text-center text-gray-600">Loading fee structures...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Fee Structures</h2>
        <button 
          onClick={() => { setEditFee(null); setIsModalOpen(true); }}
          className="bg-[#5C4033] text-[#FFFDD0] px-4 py-2 rounded hover:bg-[#4B3621] transition font-medium"
        >
          + Add New Fee Structure
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-gray-50 text-gray-600">
            <tr>
              <th scope="col" className="px-6 py-4">Fee Name</th>
              <th scope="col" className="px-6 py-4">Applicable Class</th>
              <th scope="col" className="px-6 py-4">Amount</th>
              <th scope="col" className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fees.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No fee structures found. Define your first fee!
                </td>
              </tr>
            ) : (
              fees.map((fee) => (
                <tr key={fee.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{fee.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {fee.class ? `${fee.class.name} - ${fee.class.section}` : 'All Classes'}
                  </td>
                  <td className="px-6 py-4 font-mono text-green-600 font-bold">
                    ₦{fee.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleEdit(fee)} className="text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(fee.id, fee.name)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddFeeStructureModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onFeeSaved={fetchAdminFees} 
        editFee={editFee} 
      />
    </div>
  );
}