'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ChevronDown, LogOut, User, Settings } from 'lucide-react'
import Logo from './Logo'

export default function Navigation() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user) {
      checkAdminStatus()
    } else {
      setIsAdmin(false)
    }
  }, [user])

  const checkAdminStatus = async () => {
    if (!user) return
    
    try {

      
      // Check if user is admin by querying admin_users table
      // Use maybeSingle() instead of single() to handle 0 rows gracefully
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle() // This handles 0 rows gracefully

      if (error) {
        console.error('Admin status check error:', error)
        setIsAdmin(false)
      } else if (data) {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
    } catch (error) {
      console.error('Unexpected error checking admin status:', error)
      setIsAdmin(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setIsDropdownOpen(false)
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Left: logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/greenbox-header-5.png"
              alt="Green Box Barbados"
              width={600}
              height={168}
              className="h-12 w-auto max-w-[180px] md:h-14 md:max-w-[220px] object-contain"
              priority
            />
          </Link>

          {/* Center: links (take remaining space) */}
          <div className="hidden md:flex flex-1 items-center justify-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-green-600 transition-colors">
              Home
            </Link>
            <Link href="/order-now" className="text-gray-600 hover:text-green-600 transition-colors">
              Order Now
            </Link>
            {user && (
              <Link href="/account" className="text-gray-600 hover:text-green-600 transition-colors">
                Account
              </Link>
            )}
          </div>

          {/* Right: auth (don't let it shrink) */}
          <div className="flex items-center space-x-4 shrink-0">
            {authLoading ? (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span className="text-sm">Loading...</span>
              </div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-600 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {profile?.full_name || user.email?.split('@')[0] || 'User'}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {mounted && isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Account Settings
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="btn-primary text-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 