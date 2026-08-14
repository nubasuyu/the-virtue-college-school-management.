import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react'; // 👈 1. Added Menu and X icons
import api from '../lib/axios';

// Define navigation links for each role
const roleNavLinks = {
  SUPER_ADMIN: [
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
    { name: 'AI Grading', path: '/grading' },
    { name: 'Academic Settings', path: '/academic-settings' },
    { name: 'QR Scanner', path: '/qr-scanner' },
    { name: 'Bulk Upload', path: '/bulk-upload-students' },
    { name: 'Parents', path: '/parents' },
  ],
  SCHOOL_ADMIN: [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Students', path: '/students' },
    { name: 'Teachers', path: '/teachers' },
    { name: 'Classes', path: '/classes' },
    { name: 'Subjects', path: '/subjects' },
    { name: 'Announcements', path: '/announcements' },
    { name: 'Attendance', path: '/attendance' },
    { name: 'Timetable', path: '/schedule' },
    { name: 'Library', path: '/library' },
    { name: 'Academic Settings', path: '/academic-settings' },
    { name: 'QR Scanner', path: '/qr-scanner' },
    { name: 'Bulk Upload', path: '/bulk-upload-students' },
    { name: 'Parents', path: '/parents' },
  ],
  TEACHER: [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Students', path: '/students' },
    { name: 'Classes', path: '/classes' },
    { name: 'Subjects', path: '/subjects' },
    { name: 'Announcements', path: '/announcements' },
    { name: 'Attendance', path: '/attendance' },
    { name: 'Timetable', path: '/schedule' },
    { name: 'Gradebook', path: '/gradebook' },
    { name: 'My Exams', path: '/my-exams' },
    { name: 'AI Grading', path: '/grading' },
    { name: 'QR Scanner', path: '/qr-scanner' },
  ],
  STUDENT: [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'My Exams', path: '/my-exams' },
    { name: 'Timetable', path: '/schedule' },
    { name: 'Report Card', path: '/report-card' },
    { name: 'Library', path: '/library' },
    { name: 'Announcements', path: '/announcements' },
  ],
  PARENT: [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'My Children', path: '/my-children' },
    { name: 'Report Card', path: '/report-card' },
    { name: 'Fees', path: '/fees' },
    { name: 'Payments', path: '/payments' },
    { name: 'Library', path: '/library' },
    { name: 'Announcements', path: '/announcements' },
  ],
  ACCOUNTANT: [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Fees', path: '/fees' },
    { name: 'Payments', path: '/payments' },
    { name: 'Students', path: '/students' },
  ],
};

export default function Layout() {
  const location = useLocation();
  const [userRole, setUserRole] = useState('SUPER_ADMIN');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // 👇 2. Add state to track if the mobile menu is open
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        let user = JSON.parse(storedUser);
        setCurrentUser(user);
        setUserRole(user.role || 'SUPER_ADMIN');

        if (user.role === 'PARENT' && (!user.children || user.children.length === 0)) {
          api.get('/parents/my-children')
            .then(res => {
              if (res.data && res.data.length > 0) {
                const updatedUser = { ...user, children: res.data };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setCurrentUser(updatedUser);
              }
            })
            .catch(err => {
              console.error('Failed to fetch parent children:', err);
            });
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navLinks = roleNavLinks[userRole as keyof typeof roleNavLinks] || roleNavLinks.SUPER_ADMIN;

  return (
    <div className="flex min-h-screen bg-cream-100">
      
      {/* 👇 3. The Sidebar: Hidden off-screen on mobile, always visible on desktop */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-brown-800 text-cream-50 flex flex-col shadow-lg transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:z-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 flex flex-col items-center border-b border-brown-900">
          <img 
            src="/logo.jpg" 
            alt="The Virtue College Logo" 
            className="w-16 h-16 rounded-full object-cover border-2 border-cream-50 mb-3 shadow-md" 
          />
          <h1 className="text-xl font-bold text-center text-cream-50">
            The Virtue College
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              // 👇 Close mobile menu when a link is clicked
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `w-full text-left px-4 py-3 rounded-lg transition-colors block ${
                  isActive
                    ? 'bg-brown-900 text-cream-50 font-semibold shadow-md'
                    : 'text-cream-100 hover:bg-brown-900 hover:text-cream-50'
                }`
              }
            >
              {link.name}
            </NavLink>
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

      {/* 👇 4. Dark Overlay: Closes the menu when you tap outside it on mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Navbar */}
        <header className="relative z-20 bg-white shadow-sm p-4 flex justify-between items-center border-b border-cream-200">
          
          <div className="flex items-center gap-4">
            {/* 👇 5. Hamburger Button: ONLY visible on mobile (md:hidden) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-brown-800 hover:bg-cream-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <h2 className="text-xl font-semibold text-brown-800">
              {navLinks.find((l) => l.path === location.pathname)?.name || 'Page'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            {(() => {
              const displayName = currentUser 
                ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'User' 
                : 'Admin User';
                
              const initial = currentUser 
                ? (currentUser.firstName || currentUser.email || 'U').charAt(0).toUpperCase() 
                : 'A';

              return (
                <>
                  <span className="hidden sm:block text-brown-800 font-medium">{displayName}</span>
                  <div className="w-10 h-10 bg-brown-800 rounded-full flex items-center justify-center text-cream-50 font-bold">
                    {initial}
                  </div>
                </>
              );
            })()}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-cream-100 w-full">
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  );
}