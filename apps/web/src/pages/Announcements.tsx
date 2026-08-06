import { useEffect, useState } from 'react';
import api from '../lib/axios';
import AddAnnouncementModal from '../components/AddAnnouncementModal';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  targetAudience?: string;
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  // 👇 GET USER ROLE FOR RBAC
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role;
  
  // Only Admins and Teachers can manage announcements
  const canManage = role === 'SUPER_ADMIN' || role === 'SCHOOL_ADMIN' || role === 'TEACHER';

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/announcement');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await api.delete(`/announcement/${id}`);
        fetchAnnouncements();
      } catch (error) {
        alert('Failed to delete announcement.');
      }
    }
  };

  const handleEdit = (item: any) => {
    setEditItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditItem(null);
    setIsModalOpen(false);
  };

  if (loading) return <div className="p-4 text-gray-600">Loading announcements...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#5C4033]">School Announcements</h2>
        
        {/* 👇 NEW ANNOUNCEMENT BUTTON - ONLY FOR ADMINS/TEACHERS */}
        {canManage && (
          <button 
            onClick={() => { setEditItem(null); setIsModalOpen(true); }}
            className="bg-[#5C4033] text-[#FFFDD0] px-4 py-2 rounded hover:bg-[#4B3621] transition font-medium flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
            </svg>
            New Announcement
          </button>
        )}
      </div>
      
      {/* 📢 Beautiful Card Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {announcements.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-lg shadow text-center text-gray-500">
            No announcements yet. {canManage && 'Click "New Announcement" to publish one!'}
          </div>
        ) : (
          announcements.map((item) => (
            <div key={item.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition border-l-4 border-[#5C4033]">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  {item.targetAudience && item.targetAudience !== 'ALL' && (
                    <span className="text-xs bg-[#FFFDD0] text-[#5C4033] px-2 py-0.5 rounded-full font-semibold border border-[#5C4033]/20">
                      {item.targetAudience}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <p className="text-gray-600 whitespace-pre-line mb-4">{item.content}</p>
              
              {/* 👇 EDIT/DELETE ACTIONS - ONLY FOR ADMINS/TEACHERS */}
              {canManage && (
                <div className="flex justify-end gap-3 border-t border-gray-100 pt-3">
                  <button onClick={() => handleEdit(item)} className="text-sm text-blue-600 hover:underline font-medium">Edit</button>
                  <button onClick={() => handleDelete(item.id, item.title)} className="text-sm text-red-600 hover:underline font-medium">Delete</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <AddAnnouncementModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSaved={fetchAnnouncements} 
        editItem={editItem} 
      />
    </div>
  );
}