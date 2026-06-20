import { useEffect, useState } from 'react';
import api from '../lib/axios';
import AddSubjectModal from '../components/AddSubjectModal';

interface Subject {
  id: string;
  name: string;
  code: string;
}

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<any>(null);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subject');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete subject ${name}?`)) {
      try {
        await api.delete(`/subject/${id}`);
        fetchSubjects();
      } catch (error) {
        alert('Failed to delete subject.');
      }
    }
  };

  const handleEdit = (subject: any) => {
    setEditSubject(subject);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditSubject(null);
    setIsModalOpen(false);
  };

  if (loading) return <div className="p-4 text-gray-600">Loading subjects...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">All Subjects</h2>
        <button 
          onClick={() => { setEditSubject(null); setIsModalOpen(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium"
        >
          + Add New Subject
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-gray-50 text-gray-600">
            <tr>
              <th scope="col" className="px-6 py-4">Subject Name</th>
              <th scope="col" className="px-6 py-4">Code</th>
              <th scope="col" className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  No subjects found. Add your first subject!
                </td>
              </tr>
            ) : (
              subjects.map((subject) => (
                <tr key={subject.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{subject.name}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono bg-gray-100 rounded px-2 py-1 inline-block mt-2 ml-6">{subject.code}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleEdit(subject)} className="text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(subject.id, subject.name)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddSubjectModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSubjectSaved={fetchSubjects} 
        editSubject={editSubject} 
      />
    </div>
  );
}