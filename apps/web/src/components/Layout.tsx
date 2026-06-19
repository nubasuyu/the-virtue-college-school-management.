import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const navLinks = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Students', path: '/students' },
  { name: 'Teachers', path: '/teachers' },
  { name: 'Classes', path: '/classes' },
  { name: 'Fees', path: '/fees' },
  { name: 'Timetable', path: '/timetable' },
  { name: 'Library', path: '/library' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col shadow-lg">
        <div className="p-6 text-2xl font-bold border-b border-blue-800">
          The Virtue College
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                location.pathname === link.path
                  ? 'bg-blue-700 text-white font-semibold'
                  : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              {link.name}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-800">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {navLinks.find((l) => l.path === location.pathname)?.name || 'Page'}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 font-medium">Admin User</span>
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}