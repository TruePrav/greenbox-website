'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, UserProfile } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<{ error: any }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isFetchingProfile, setIsFetchingProfile] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setUser(session?.user ?? null)
          
          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
          }
        } catch (error) {
          console.error('Error in auth state change:', error)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // Remove fetchProfile from dependencies to prevent infinite loops

  const fetchProfile = async (userId: string, retryCount = 0) => {
    // Prevent multiple simultaneous profile fetches
    if (isFetchingProfile) {
      return
    }
    
    setIsFetchingProfile(true)
    
    try {
      // Reduced timeout to 5 seconds to prevent stuck pages
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )

      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const { data, error } = await Promise.race([profilePromise, timeoutPromise]) as any

      if (!error && data) {
        setProfile(data)
      } else {
        // Only create profile if it's a "not found" error, not other errors
        if (error?.code === 'PGRST116') {
          // Get the current user to access their email
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          
          const { data: newProfile } = await supabase
            .from('user_profiles')
            .insert({
              id: userId,
              full_name: '',
              phone: '',
              address: '',
              dietary_restrictions: '',
              preferences: '',
              email: currentUser?.email || '' // Include email from auth user
            })
            .select()
            .single()

          if (newProfile) {
            setProfile(newProfile)
          }
        } else {
          console.error('Error fetching profile:', error)
          
          // Reduced retry attempts to prevent infinite loops
          if (retryCount < 1) {
            setTimeout(() => {
              fetchProfile(userId, retryCount + 1)
            }, 2000) // Fixed 2 second delay
            return
          }
          
          // If all retries failed, don't block the app
          console.warn('Profile fetch failed after retries, continuing without profile')
        }
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error)
      
      // Reduced retry logic for timeout errors
      if (error instanceof Error && error.message.includes('timeout') && retryCount < 1) {
        setTimeout(() => {
          fetchProfile(userId, retryCount + 1)
        }, 2000)
        return
      }
      
      // Don't block the app if profile fetch fails
      console.warn('Profile fetch failed, continuing without profile')
    } finally {
      setIsFetchingProfile(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      console.error('Error signing in:', error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      return { error }
    } catch (error) {
      console.error('Error signing up:', error)
      return { error }
    }
  }

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Error refreshing session:', error)
        return { error }
      }
      if (data.session) {
        setUser(data.session.user)
        await fetchProfile(data.session.user.id)
        return { error: null }
      }
      return { error: new Error('No session after refresh') }
    } catch (error) {
      console.error('Unexpected error refreshing session:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      // Check if we have a valid session before signing out
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
  
        setUser(null)
        setProfile(null)
        return
      }


      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Supabase signOut error:', error)
        // Even if Supabase fails, clear local state
        setUser(null)
        setProfile(null)
        throw error
      }


      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
      // Clear local state even if there's an error
      setUser(null)
      setProfile(null)
      
      // If it's a 403 error, it might be a session issue
      if (error && typeof error === 'object' && 'status' in error && error.status === 403) {
  
        // Force redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') }

    try {
      // Use the RPC function instead of direct table update
      
      const { error } = await supabase.rpc('update_my_profile', {
        p_full_name: updates.full_name || '',
        p_dietary_restrictions: updates.dietary_restrictions || '',
        p_preferences: updates.preferences || '',
        p_phone: updates.phone || '',
        p_address: updates.address || '',
        p_latitude: updates.latitude || 0,
        p_longitude: updates.longitude || 0,
        p_include_cutlery: updates.include_cutlery || false
      })

      if (error) {
        console.error('RPC update error:', error)
        return { error }
      }


      
      // Refresh the profile data to get the updated values
      const { data: refreshedProfile, error: refreshError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (refreshError) {
        console.error('Error refreshing profile:', refreshError)
        return { error: refreshError }
      }

      if (refreshedProfile) {
        setProfile(refreshedProfile)
        return { error: null }
      } else {
        return { error: new Error('Failed to refresh profile data') }
      }
    } catch (error) {
      console.error('Unexpected error in updateProfile:', error)
      return { error: error instanceof Error ? error : new Error('Unknown error occurred') }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
    updateProfile,
  }

  // Don't render children until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 