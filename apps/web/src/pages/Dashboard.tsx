import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">Admin Dashboard</h1>
          <button 
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
        <p className="text-gray-600 text-lg">
          Welcome to The Virtue College School Management System! 🎉
        </p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h3 className="font-bold text-blue-800">Students</h3>
            <p className="text-sm text-blue-600">Manage student records</p>
          </div>
          <div className="bg-green-50 p-4 rounded border border-green-200">
            <h3 className="font-bold text-green-800">Fees</h3>
            <p className="text-sm text-green-600">Track payments</p>
          </div>
          <div className="bg-purple-50 p-4 rounded border border-purple-200">
            <h3 className="font-bold text-purple-800">Timetable</h3>
            <p className="text-sm text-purple-600">View schedules</p>
          </div>
        </div>
      </div>
    </div>
  );
}