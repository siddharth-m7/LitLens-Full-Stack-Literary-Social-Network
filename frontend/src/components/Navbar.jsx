import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileUser, setProfileUser] = useState({});

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setProfileUser(res.data);
      } catch (err) {
        console.error('Failed to load user profile:', err);
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <nav className="bg-white border-b border-[#E8E0CE] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
          >
            <span className="text-xl">📚</span>
            <span>BookShelf</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Home
            </Link>

            <Link
              to="/about"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              About
            </Link>

            <Link
              to="/leaderboard"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Leaderboard
            </Link>

            {user && (
              <Link
                to="/profile"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                Profile
              </Link>
            )}
          </div>

          {/* Desktop Authentication */}
          <div className="hidden md:flex items-center space-x-3">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="border border-gray-900 text-gray-900 px-4 py-2.5 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                >
                  Register
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="flex items-center space-x-2 group">
                  <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {(profileUser?.name || profileUser?.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-gray-700 text-sm font-medium hidden lg:block group-hover:text-gray-900 transition-colors">
                    {profileUser?.name || profileUser?.email || 'User'}
                  </span>
                </Link>

                <button
                  onClick={logout}
                  className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden transition-all duration-200 ease-in-out ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="border-t border-[#E8E0CE] py-3 space-y-1 bg-white">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="block text-gray-600 hover:text-gray-900 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Home
            </Link>

            <Link
              to="/about"
              onClick={closeMobileMenu}
              className="block text-gray-600 hover:text-gray-900 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              About
            </Link>

            <Link
              to="/leaderboard"
              onClick={closeMobileMenu}
              className="block text-gray-600 hover:text-gray-900 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Leaderboard
            </Link>

            {user && (
              <Link
                to="/profile"
                onClick={closeMobileMenu}
                className="block text-gray-600 hover:text-gray-900 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Profile
              </Link>
            )}

            {/* Mobile Authentication */}
            <div className="border-t border-[#E8E0CE] pt-3 mt-2">
              {!user ? (
                <div className="space-y-2 px-4">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="block border border-gray-900 text-gray-900 py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm text-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="block bg-gray-900 text-white py-2.5 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm text-center"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center px-4 py-2">
                    <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                      {(profileUser?.name || profileUser?.email || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-gray-700 font-medium text-sm">
                      {profileUser?.name || profileUser?.email || 'User'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      logout();
                      closeMobileMenu();
                    }}
                    className="w-full text-left text-gray-500 hover:text-gray-900 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
