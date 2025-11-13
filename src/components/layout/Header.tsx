import { useState } from 'react';
import { Calendar, LogOut, User, Settings, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthModal } from '../auth/AuthModal';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    onNavigate('home');
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-2 group"
            >
              <Calendar className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-bold text-gray-900">Booqup</span>
            </button>

            <nav className="flex items-center space-x-6">
              {user ? (
                <>
                  <button
                    onClick={() => onNavigate('home')}
                    className={`text-gray-700 hover:text-blue-600 font-medium ${
                      currentPage === 'home' ? 'text-blue-600' : ''
                    }`}
                  >
                    Home
                  </button>

                  {profile?.user_type === 'shop_owner' && (
                    <button
                      onClick={() => onNavigate('shop-dashboard')}
                      className={`flex items-center space-x-1 text-gray-700 hover:text-blue-600 font-medium ${
                        currentPage === 'shop-dashboard' ? 'text-blue-600' : ''
                      }`}
                    >
                      <LayoutDashboard size={18} />
                      <span>My Shop</span>
                    </button>
                  )}

                  {profile?.user_type === 'admin' && (
                    <button
                      onClick={() => onNavigate('admin')}
                      className={`flex items-center space-x-1 text-gray-700 hover:text-blue-600 font-medium ${
                        currentPage === 'admin' ? 'text-blue-600' : ''
                      }`}
                    >
                      <Settings size={18} />
                      <span>Admin</span>
                    </button>
                  )}

                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
                    >
                      <User size={20} />
                      <span className="font-medium">{profile?.full_name || 'User'}</span>
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                        <button
                          onClick={() => {
                            onNavigate('my-bookings');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                          <Calendar size={16} />
                          <span>My Bookings</span>
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Sign In
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
