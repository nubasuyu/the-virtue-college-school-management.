import { useEffect, useState } from 'react';
import api from '../lib/axios';
import AddParentModal from '../components/AddParentModal';

export default function Parents() {
  const [parents, setParents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editParent, setEditParent] = useState<any>(null);

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/parents');
      setParents(response.data || []);
    } catch (error) {
      console.error('Failed to fetch parents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await api.delete(`/parents/${id}`);
        fetchParents();
      } catch (error) {
        alert('Failed to delete parent.');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brown-800">All Parents & Guardians</h2>
        <button 
          onClick={() => { setEditParent(null); setIsModalOpen(true); }}
          className="bg-brown-800 text-cream-50 px-4 py-2 rounded-lg hover:bg-brown-900 transition font-medium"
        >
          + Add New Parent
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-cream-50 text-brown-800">
            <tr>
              <th className="px-6 py-4">Full Name</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Relation</th>
              <th className="px-6 py-4">Linked Students</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center">Loading...</td></tr>
            ) : parents.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No parents found.</td></tr>
            ) : (
              parents.map((parent) => (
                <tr key={parent.id} className="border-b border-gray-200 hover:bg-cream-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{parent.firstName} {parent.lastName}</td>
                  <td className="px-6 py-4">{parent.phone}</td>
                  <td className="px-6 py-4">{parent.email || '-'}</td>
                  <td className="px-6 py-4">{parent.studentParents?.[0]?.relation || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {parent.students?.map((s: any) => (
                        <span key={s.id} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {s.firstName} {s.lastName}
                        </span>
                      )) || <span className="text-gray-400">None</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => { setEditParent(parent); setIsModalOpen(true); }} className="text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(parent.id, `${parent.firstName} ${parent.lastName}`)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddParentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onParentSaved={fetchParents} 
        editParent={editParent} 
      />
    </div>
  );
}