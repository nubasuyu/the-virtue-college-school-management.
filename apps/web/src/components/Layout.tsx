import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const navLinks = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Students', path: '/students' },
  { name: 'Teachers', path: '/teachers' },
  { name: 'Classes', path: '/classes' },
  { name: 'Subjects', path: '/subjects' }, 
  { name: 'Fees', path: '/fees' },
  { name: 'Payments', path: '/payments' },
  { name: 'Announcements', path: '/announcements' },
  { name: 'Attendance', path: '/attendance' }, 
  { name: 'Timetable', path: '/schedule' },
  { name: 'Library', path: '/library' },
  { name: 'Gradebook', path: '/gradebook' },
  { name: 'Report Card', path: '/report-card' },
  { name: 'Promotions', path: '/promotion' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-cream-100">
      {/* Sidebar - Deep Brown */}
      <aside className="w-64 bg-brown-800 text-cream-50 flex flex-col shadow-lg min-h-screen">
        <div className="p-6 flex flex-col items-center border-b border-brown-900">
          {/* LOGO SECTION */}
          <img 
            src="/logo.jpg" 
            alt="The Virtue College Logo" 
            className="w-16 h-16 rounded-full object-cover border-2 border-cream-50 mb-3 shadow-md" 
          />
          <h1 className="text-xl font-bold text-center text-cream-50">
            The Virtue College
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                location.pathname === link.path
                  ? 'bg-brown-900 text-cream-50 font-semibold shadow-md'
                  : 'text-cream-100 hover:bg-brown-900 hover:text-cream-50'
              }`}
            >
              {link.name}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-brown-900 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar - Cream/White */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center border-b border-cream-200">
          <h2 className="text-xl font-semibold text-brown-800">
            {navLinks.find((l) => l.path === location.pathname)?.name || 'Page'}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-brown-800 font-medium">Admin User</span>
            <div className="w-10 h-10 bg-brown-800 rounded-full flex items-center justify-center text-cream-50 font-bold">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-cream-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
}