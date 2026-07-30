import { useEffect, useState } from 'react';
import api from '../lib/axios';
import AddStudentModal from '../components/AddStudentModal';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  gender: string;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<any>(null);
  
  // ✅ NEW: Track the logged-in user's role
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Fetch students
    fetchStudents();
    
    // Fetch user role from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/student');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Permission checks based on role
  const canAdd = user?.role && ['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user.role);
  const canEdit = user?.role && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(user.role);
  const canDelete = user?.role && ['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user.role);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
      try {
        await api.delete(`/student/${id}`);
        fetchStudents(); // Refresh list
      } catch (error) {
        alert('Failed to delete student.');
      }
    }
  };

  const handleEdit = (student: any) => {
    setEditStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditStudent(null);
    setIsModalOpen(false);
  };

  if (loading) return <div className="p-4 text-gray-600">Loading students...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">All Students</h2>
        
        {/* ✅ ONLY show Add button for Admins */}
        {canAdd && (
          <button 
            onClick={() => { setEditStudent(null); setIsModalOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium"
          >
            + Add New Student
          </button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-gray-50 text-gray-600">
            <tr>
              <th scope="col" className="px-6 py-4">Admission No</th>
              <th scope="col" className="px-6 py-4">Full Name</th>
              <th scope="col" className="px-6 py-4">Gender</th>
              <th scope="col" className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-mono text-blue-600">{student.admissionNo}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="px-6 py-4">{student.gender}</td>
                  <td className="px-6 py-4">
                    {/* ✅ ONLY show Edit button for Admins and Teachers */}
                    {canEdit && (
                      <button 
                        onClick={() => handleEdit(student)} 
                        className="text-blue-600 hover:underline mr-3"
                      >
                        Edit
                      </button>
                    )}
                    
                    {/* ✅ ONLY show Delete button for Admins */}
                    {canDelete && (
                      <button 
                        onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)} 
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                    
                    {/* Fallback for users who can view but not edit/delete (e.g., Accountants) */}
                    {!canEdit && !canDelete && (
                      <span className="text-gray-400 text-xs">View Only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* The Modal Component */}
      <AddStudentModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onStudentSaved={fetchStudents} 
        editStudent={editStudent} 
      />
    </div>
  );
}