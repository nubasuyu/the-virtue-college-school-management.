import { useEffect, useState } from 'react';
import api from '../lib/axios';
import AddFeeStructureModal from '../components/AddFeeStructureModal';

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  classId: string;
  class?: { name: string; section: string };
}

export default function Fees() {
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editFee, setEditFee] = useState<any>(null);

  const fetchFees = async () => {
    try {
      const response = await api.get('/fees/structure');
      setFees(response.data);
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete fee structure ${name}?`)) {
      try {
        await api.delete(`/fees/structure/${id}`);
        fetchFees();
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

  if (loading) return <div className="p-4 text-gray-600">Loading fee structures...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Fee Structures</h2>
        <button 
          onClick={() => { setEditFee(null); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium"
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
        onFeeSaved={fetchFees} 
        editFee={editFee} 
      />
    </div>
  );
}