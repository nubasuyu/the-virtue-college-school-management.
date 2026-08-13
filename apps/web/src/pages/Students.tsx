import { useEffect, useState } from 'react';
import api from '../lib/axios';
import AddStudentWizard from '../components/AddStudentWizard';
import StudentIdCard from '../components/StudentIdCard';
import ManageStudentFees from '../components/ManageStudentFees'; // 👈 NEW IMPORT

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  gender: string;
  photoUrl?: string;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  
  // State for ID Card Modal
  const [idCardStudent, setIdCardStudent] = useState<Student | null>(null);
  
  // 👈 NEW: State for Fee Management Modal
  const [feeStudent, setFeeStudent] = useState<any>(null);

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
      setStudents([]);
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

  console.log('🎨 [Students] Rendering... loading =', loading, ' | students count =', students.length);

  if (loading) {
    return (
      <div className="p-4 text-gray-600 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brown-800 mr-3"></div>
        Loading students...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brown-800">All Students</h2>
        
        {canAdd && (
          <button 
            onClick={() => { setEditStudent(null); setIsModalOpen(true); }}
            className="bg-brown-800 text-cream-50 px-4 py-2 rounded-lg hover:bg-brown-900 transition font-medium shadow-sm"
          >
            + Add New Student
          </button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
          <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-cream-50 text-brown-800">
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
                <tr key={student.id} className="border-b border-gray-200 hover:bg-cream-50 transition">
                  <td className="px-6 py-4 font-mono text-brown-800 font-semibold">{student.admissionNo}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="px-6 py-4">{student.gender}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      {/* 👇 NEW: Fees Button */}
                      <button 
                        onClick={() => setFeeStudent(student)} 
                        className="text-purple-600 hover:text-purple-800 hover:underline text-sm font-medium mr-3"
                      >
                        Fees
                      </button>

                      {/* ID Card Button */}
                      <button 
                        onClick={() => setIdCardStudent(student)}
                        className="text-green-600 hover:text-green-800 hover:underline text-sm font-medium"
                      >
                        ID Card
                      </button>

                      {canEdit && (
                        <button 
                          onClick={() => handleEdit(student)} 
                          className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
                        >
                          Edit
                        </button>
                      )}
                      
                      {canDelete && (
                        <button 
                          onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)} 
                          className="text-red-600 hover:text-red-800 hover:underline text-sm font-medium"
                        >
                          Delete
                        </button>
                      )}
                      
                      {!canEdit && !canDelete && (
                        <span className="text-gray-400 text-xs">View Only</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Student Wizard */}
      <AddStudentWizard 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onStudentSaved={fetchStudents} 
        editStudent={editStudent} 
      />

      {/* ID Card Modal */}
      {idCardStudent && (
        <StudentIdCard 
          student={idCardStudent} 
          onClose={() => setIdCardStudent(null)} 
        />
      )}

      {/* 👇 NEW: Manage Student Fees Modal */}
      {feeStudent && (
        <ManageStudentFees 
          isOpen={!!feeStudent} 
          onClose={() => setFeeStudent(null)} 
          studentId={feeStudent.id} 
          studentName={`${feeStudent.firstName} ${feeStudent.lastName}`}
          onFeesUpdated={() => {}} 
        />
      )}
    </div>
  );
}