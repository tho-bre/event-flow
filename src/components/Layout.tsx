import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  LogOut,
  Menu
} from 'lucide-react';

export default function Layout() {
  const { signOut, associationName } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { path: '/events', icon: Calendar, label: 'Événements' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-blue-600">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Link to="/events" className="text-white hover:text-blue-100">
                <div>
                  <h1 className="text-2xl font-bold">EventFlow</h1>
                  {associationName && (
                    <p className="text-sm text-blue-200 mt-1">{associationName}</p>
                  )}
                </div>
              </Link>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${
                      location.pathname.startsWith(item.path)
                        ? 'bg-blue-700 text-white'
                        : 'text-blue-100 hover:bg-blue-700'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <Icon className="mr-3 h-6 w-6" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-blue-700 p-4">
            <button
              onClick={handleSignOut}
              className="flex-shrink-0 w-full group block"
            >
              <div className="flex items-center">
                <LogOut className="inline-block h-6 w-6 text-blue-200" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-200">Déconnexion</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden">
        <div className="bg-blue-600 px-4 py-2 flex items-center justify-between">
          <Link to="/events" className="text-white hover:text-blue-100">
            <div>
              <h1 className="text-xl font-bold">EventFlow</h1>
              {associationName && (
                <p className="text-sm text-blue-200">{associationName}</p>
              )}
            </div>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="bg-blue-600 px-2 pt-2 pb-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`${
                    location.pathname.startsWith(item.path)
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-700'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="mr-4 h-6 w-6" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="w-full text-left text-blue-100 hover:bg-blue-700 group flex items-center px-2 py-2 text-base font-medium rounded-md"
            >
              <LogOut className="mr-4 h-6 w-6" />
              Déconnexion
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}