'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { authApi } from '@/lib/api'
import type { User } from '@/types'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      authApi.getCurrentUser()
        .then((userData) => {
          setUser(userData)
          setIsAuthenticated(true)
        })
        .catch(() => {
          localStorage.removeItem('auth_token')
          setIsAuthenticated(false)
        })
    }
  }, [])

  const handleLogin = () => {
    authApi.login()
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
      setUser(null)
      setIsAuthenticated(false)
      window.location.href = '/'
    } catch (error) {
      console.error('Logout failed:', error)
      // Force logout even if API call fails
      localStorage.removeItem('auth_token')
      setUser(null)
      setIsAuthenticated(false)
      window.location.href = '/'
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900">
                GitHub Repo Manager
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-3">
                  {user && (
                    <div className="flex items-center space-x-2">
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.avatar_url}
                        alt={user.login}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {user.login}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLogin}
                className="btn-primary"
              >
                Sign In with GitHub
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="text-gray-700 hover:text-gray-900 focus:outline-none focus:text-gray-900"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {user && (
                    <div className="flex items-center space-x-2 px-3 py-2">
                      <img
                        className="h-8 w-8 rounded-full"
                        src={user.avatar_url}
                        alt={user.login}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {user.login}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleLogin}
                  className="btn-primary w-full mt-2"
                >
                  Sign In with GitHub
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}