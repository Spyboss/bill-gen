import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
    setUserMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                Bill Generator
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Dashboard
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/bills"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/bills')
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Bills
                  </Link>

                  <Link
                    to="/bills/new"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/bills/new')
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Create Bill
                  </Link>

                  <Link
                    to="/inventory"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname.startsWith('/inventory')
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    Inventory
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={toggleUserMenu}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center">
                      {user?.email ? (
                        <span className="text-blue-800 font-medium uppercase">
                          {user.email.charAt(0)}
                        </span>
                      ) : (
                        <svg
                          className="h-5 w-5 text-blue-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                </div>

                {/* User dropdown menu */}
                {userMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                      Signed in as <span className="font-semibold">{user?.email}</span>
                    </div>

                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Your Profile
                    </Link>

                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Settings
                    </Link>

                    <button
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={handleLogout}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  to="/login"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/login')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/register')
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            {isAuthenticated ? (
              <button
                type="button"
                className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={toggleUserMenu}
              >
                <span className="sr-only">Open menu</span>
                <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center">
                  {user?.email ? (
                    <span className="text-blue-800 font-medium uppercase">
                      {user.email.charAt(0)}
                    </span>
                  ) : (
                    <svg
                      className="h-5 w-5 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </div>
              </button>
            ) : (
              <div className="flex">
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile user menu */}
      {userMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 pt-4 pb-3 px-4">
          <div className="flex items-center px-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center">
                <span className="text-blue-800 font-medium uppercase">
                  {user?.email?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800">{user?.email}</div>
              <div className="text-sm font-medium text-gray-500">{user?.role}</div>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <Link
              to="/"
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              onClick={() => setUserMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/bills"
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              onClick={() => setUserMenuOpen(false)}
            >
              Bills
            </Link>
            <Link
              to="/bills/new"
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              onClick={() => setUserMenuOpen(false)}
            >
              Create Bill
            </Link>
            <Link
              to="/inventory"
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              onClick={() => setUserMenuOpen(false)}
            >
              Inventory
            </Link>
            <div className="border-t border-gray-200 my-2"></div>
            <Link
              to="/profile"
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              onClick={() => setUserMenuOpen(false)}
            >
              Your Profile
            </Link>
            <Link
              to="/settings"
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              onClick={() => setUserMenuOpen(false)}
            >
              Settings
            </Link>
            <button
              className="w-full text-left block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}