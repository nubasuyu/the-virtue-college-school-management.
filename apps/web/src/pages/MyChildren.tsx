import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';

export default function MyChildren() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        
        // 👇 DYNAMICALLY use the children array populated by Layout.tsx
        if (user?.children && user.children.length > 0) {
          setChildren(user.children);
        } else {
          // Fallback: fetch from the new endpoint just in case Layout hasn't finished yet
          const res = await api.get('/parents/my-children');
          setChildren(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch children:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-600">Loading children...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#5C4033] mb-6">My Children</h1>
      
      {children.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
          No children are currently linked to your parent account. Please contact the school administration.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <div key={child.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-[#FFFDD0] rounded-full flex items-center justify-center text-[#5C4033] font-bold text-2xl shadow-inner">
                  {child.firstName?.charAt(0) || 'S'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{child.firstName} {child.lastName}</h3>
                  <p className="text-sm text-gray-500">{child.admissionNo}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Class:</span>
                  <span className="font-semibold">{child.currentClass?.name || 'N/A'} - {child.currentClass?.section || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date of Birth:</span>
                  <span className="font-semibold">{child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button 
                  onClick={() => navigate('/report-card')}
                  className="flex-1 bg-[#5C4033] text-[#FFFDD0] py-2 rounded-lg hover:bg-[#4B3621] transition text-sm font-semibold"
                >
                  View Report Card
                </button>
                <button 
                  onClick={() => navigate('/fees')}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition text-sm font-semibold"
                >
                  View Fees
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}