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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    console.log('🔄 [Students] Component mounted. Starting initial fetch...');
    fetchStudents();
    
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log('👤 [Students] User loaded from localStorage. Role:', parsedUser.role);
      } catch (e) {
        console.error('❌ [Students] Failed to parse user from localStorage', e);
      }
    }
  }, []);

  const fetchStudents = async () => {
    console.log('📡 [Students] fetchStudents called. Setting loading = true');
    setLoading(true);
    try {
      const response = await api.get('/student');
      console.log('✅ [Students] API response received successfully. Data length:', response.data?.length);
      setStudents(response.data || []);
    } catch (error) {
      console.error('❌ [Students] Error fetching students:', error);
      setStudents([]); // Ensure we have an empty array on error
    } finally {
      console.log('🏁 [Students] fetchStudents finished. Setting loading = false');
      setLoading(false);
    }
  };

  const canAdd = user?.role && ['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user.role);
  const canEdit = user?.role && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(user.role);
  const canDelete = user?.role && ['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(user.role);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
      try {
        await api.delete(`/student/${id}`);
        fetchStudents();
      } catch (error) {
        console.error('Failed to delete student:', error);
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

  // 👇 DEBUG: Log every time the component renders
  console.log('🎨 [Students] Rendering... loading =', loading, ' | students count =', students.length);

  if (loading) {
    return (
      <div className="p-4 text-gray-600 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Loading students...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">All Students</h2>
        
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
                    {canEdit && (
                      <button 
                        onClick={() => handleEdit(student)} 
                        className="text-blue-600 hover:underline mr-3"
                      >
                        Edit
                      </button>
                    )}
                    
                    {canDelete && (
                      <button 
                        onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)} 
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                    
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

      <AddStudentModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onStudentSaved={fetchStudents} 
        editStudent={editStudent} 
      />
    </div>
  );
}