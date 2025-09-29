import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthResponse } from '@supabase/supabase-js'
import { supabase, User as AppUser } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  userProfile: AppUser | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<AuthResponse>
  signUp: (email: string, password: string, displayName: string) => Promise<AuthResponse>
  signInWithGoogle: () => Promise<{data: any, error: any}> // eslint-disable-line @typescript-eslint/no-explicit-any
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<AppUser>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<AppUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchingProfile, setFetchingProfile] = useState(false) // Prevent multiple fetches

  // Add timeout for loading state
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⏰ AuthContext: Loading timeout reached, forcing loading to false')
        setLoading(false)
      }
    }, 5000) // 5 second timeout

    return () => clearTimeout(timeout)
  }, [loading])

  useEffect(() => {
    console.log('🔄 AuthContext: Starting initialization...')
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔄 AuthContext: Initial session retrieved:', session?.user?.id || 'No user')
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user && !fetchingProfile) {
        console.log('🔄 AuthContext: User found, fetching profile...')
        fetchUserProfile(session.user.id)
      } else {
        console.log('🔄 AuthContext: No user, setting loading to false')
        setLoading(false)
      }
    }).catch((error) => {
      console.error('❌ AuthContext: Error getting initial session:', error)
      setLoading(false)
    })

    // Listen for auth changes
    let subscription: { unsubscribe?: () => void } | null = null

    try {
      const authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id)
        setSession(session)
        setUser(session?.user ?? null)

        if (event === 'SIGNED_IN' && session?.user && !fetchingProfile) {
          console.log('User signed in, fetching profile...')
          await fetchUserProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          setUserProfile(null)
          setFetchingProfile(false)
          setLoading(false)
        } else if (session?.user && !fetchingProfile) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
          setLoading(false)
        }
      })

      subscription = authSubscription?.data?.subscription || null
    } catch (error) {
      console.error('❌ AuthContext: Error setting up auth state listener:', error)
      setLoading(false)
    }

    return () => {
      try {
        if (subscription?.unsubscribe && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.warn('⚠️ AuthContext: Error unsubscribing from auth state changes:', error)
      }
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    if (fetchingProfile) {
      console.log('🔄 AuthContext: Already fetching profile, skipping...')
      return
    }

    setFetchingProfile(true)
    const fetchTimeout = setTimeout(() => {
      console.warn('⏰ AuthContext: Profile fetch timeout, using fallback')
      createFallbackProfile()
    }, 8000) // 8 second timeout for profile fetch

    try {
      console.log('🔄 AuthContext: fetchUserProfile started for:', userId)

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle to avoid errors when no results

      clearTimeout(fetchTimeout)

      if (error) {
        console.warn('Database error fetching user profile:', error)
        createFallbackProfile()
        return
      }

      if (!data) {
        console.log('User not found in database, creating new user...')
        createFallbackProfile()
        return
      }

      console.log('✅ AuthContext: User profile fetched successfully:', data)
      setUserProfile(data)
    } catch (error) {
      clearTimeout(fetchTimeout)
      console.error('❌ AuthContext: Error in fetchUserProfile:', error)
      createFallbackProfile()
    } finally {
      console.log('🔄 AuthContext: Setting loading to false')
      setFetchingProfile(false)
      setLoading(false)
    }
  }

  const createFallbackProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const userIdForSearch = `yellowtalk_${Math.random().toString(36).substr(2, 9)}`
        const displayName = user.user_metadata?.full_name ||
                           user.user_metadata?.name ||
                           user.email?.split('@')[0] ||
                           'User'

        const fallbackProfile = {
          id: user.id,
          email: user.email!,
          display_name: displayName,
          user_id: userIdForSearch,
          status_message: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        console.log('✅ AuthContext: Using fallback profile:', fallbackProfile)
        setUserProfile(fallbackProfile)

        // Try to create in database in the background
        supabase
          .from('users')
          .insert(fallbackProfile)
          .then(({ error: insertError }) => {
            if (insertError) {
              console.warn('Failed to save fallback profile to DB:', insertError)
            } else {
              console.log('Fallback profile saved to DB successfully')
            }
          })
          .catch(err => console.warn('Error saving fallback profile:', err))
      }
    } catch (error) {
      console.error('❌ AuthContext: Error creating fallback profile:', error)
    } finally {
      setFetchingProfile(false)
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: displayName,
          display_name: displayName
        }
      }
    })

    return { data, error }
  }

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google OAuth...')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('Google OAuth error:', error)
      } else {
        console.log('Google OAuth initiated successfully')
      }

      return { data, error }
    } catch (error) {
      console.error('Error in signInWithGoogle:', error)
      return { data: null, error: error as any } // eslint-disable-line @typescript-eslint/no-explicit-any
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: Partial<AppUser>) => {
    if (!user) return

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (!error && userProfile) {
      setUserProfile({ ...userProfile, ...updates })
    }
  }

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}