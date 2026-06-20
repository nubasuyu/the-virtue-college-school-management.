import { useEffect, useState } from 'react';
import api from '../lib/axios';
import AddTeacherModal from '../components/AddTeacherModal';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  subject?: string;
}

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<any>(null);

  const fetchTeachers = async () => {
    try {
      const response = await api.get('/teacher');
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
      try {
        await api.delete(`/teacher/${id}`);
        fetchTeachers();
      } catch (error) {
        alert('Failed to delete teacher.');
      }
    }
  };

  const handleEdit = (teacher: any) => {
    setEditTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditTeacher(null);
    setIsModalOpen(false);
  };

  if (loading) return <div className="p-4 text-gray-600">Loading teachers...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">All Teachers</h2>
        <button 
          onClick={() => { setEditTeacher(null); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium"
        >
          + Add New Teacher
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-gray-50 text-gray-600">
            <tr>
              <th scope="col" className="px-6 py-4">Full Name</th>
              <th scope="col" className="px-6 py-4">Email</th>
              <th scope="col" className="px-6 py-4">Subject</th>
              <th scope="col" className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No teachers found. Add your first teacher!
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {teacher.firstName} {teacher.lastName}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{teacher.email}</td>
                  <td className="px-6 py-4 text-gray-600">{teacher.subject || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleEdit(teacher)} className="text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(teacher.id, `${teacher.firstName} ${teacher.lastName}`)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddTeacherModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onTeacherSaved={fetchTeachers} 
        editTeacher={editTeacher} 
      />
    </div>
  );
}