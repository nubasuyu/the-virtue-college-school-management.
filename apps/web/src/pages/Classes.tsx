import { useEffect, useState } from 'react';
import api from '../lib/axios';
import AddClassModal from '../components/AddClassModal';

interface ClassItem {
  id: string;
  name: string;
  section: string;
  classTeacher?: { firstName: string; lastName: string };
  classTeacherId?: string;
}

export default function Classes() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editClass, setEditClass] = useState<any>(null);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/class');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete class ${name}? This cannot be undone.`)) {
      try {
        await api.delete(`/class/${id}`);
        fetchClasses();
      } catch (error) {
        alert('Failed to delete class. It might have students assigned to it.');
      }
    }
  };

  const handleEdit = (cls: any) => {
    setEditClass(cls);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditClass(null);
    setIsModalOpen(false);
  };

  if (loading) return <div className="p-4 text-gray-600">Loading classes...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">All Classes</h2>
        <button 
          onClick={() => { setEditClass(null); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium"
        >
          + Add New Class
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-gray-50 text-gray-600">
            <tr>
              <th scope="col" className="px-6 py-4">Class Name</th>
              <th scope="col" className="px-6 py-4">Section</th>
              <th scope="col" className="px-6 py-4">Class Teacher</th>
              <th scope="col" className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No classes found. Add your first class!
                </td>
              </tr>
            ) : (
              classes.map((cls) => (
                <tr key={cls.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{cls.name}</td>
                  <td className="px-6 py-4 text-gray-600">{cls.section}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {cls.classTeacher 
                      ? `${cls.classTeacher.firstName} ${cls.classTeacher.lastName}` 
                      : (cls.classTeacherId ? 'Teacher Assigned' : 'Unassigned')}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleEdit(cls)} className="text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(cls.id, cls.name)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddClassModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onClassSaved={fetchClasses} 
        editClass={editClass} 
      />
    </div>
  );
}