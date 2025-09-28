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
      if (session?.user) {
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)
      setSession(session)
      setUser(session?.user ?? null)

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, fetching profile...')
        await fetchUserProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out')
        setUserProfile(null)
        setLoading(false)
      } else if (session?.user) {
        await fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔄 AuthContext: fetchUserProfile started for:', userId)

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.warn('Database error fetching user profile:', error)

        // 사용자가 DB에 없다면 자동으로 생성 시도
        if (error.code === 'PGRST116') {
          console.log('User not found in database, creating new user...')
          const { data: { user } } = await supabase.auth.getUser()

          if (user) {
            const userIdForSearch = `yellowtalk_${Math.random().toString(36).substr(2, 9)}`
            const displayName = user.user_metadata?.full_name ||
                               user.user_metadata?.name ||
                               user.email?.split('@')[0] ||
                               'User'

            // Create a fallback user profile immediately
            const fallbackProfile = {
              id: user.id,
              email: user.email!,
              display_name: displayName,
              user_id: userIdForSearch,
              status_message: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }

            // Try to create in database, but don't wait for it
            supabase
              .from('users')
              .insert(fallbackProfile)
              .then(({ data: newUser, error: insertError }) => {
                if (insertError) {
                  console.warn('Failed to create user profile in DB:', insertError)
                } else {
                  console.log('User created successfully in DB:', newUser)
                }
              })

            // Set the fallback profile immediately so user can proceed
            console.log('✅ AuthContext: Using fallback profile for user')
            setUserProfile(fallbackProfile)
            setLoading(false)
            return
          }
        }

        // For any other error, create a minimal profile to let user proceed
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const fallbackProfile = {
            id: user.id,
            email: user.email!,
            display_name: user.email?.split('@')[0] || 'User',
            user_id: `yellowtalk_${Math.random().toString(36).substr(2, 9)}`,
            status_message: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          console.log('✅ AuthContext: Using minimal profile due to error')
          setUserProfile(fallbackProfile)
        }
        setLoading(false)
        return
      }

      console.log('✅ AuthContext: User profile fetched successfully:', data)
      setUserProfile(data)
    } catch (error) {
      console.error('❌ AuthContext: Error in fetchUserProfile:', error)
      // Even on error, try to create a minimal profile so user can proceed
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const fallbackProfile = {
          id: user.id,
          email: user.email!,
          display_name: user.email?.split('@')[0] || 'User',
          user_id: `yellowtalk_${Math.random().toString(36).substr(2, 9)}`,
          status_message: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        console.log('✅ AuthContext: Using fallback profile after error')
        setUserProfile(fallbackProfile)
      }
    } finally {
      console.log('🔄 AuthContext: Setting loading to false')
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