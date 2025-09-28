import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, User as AppUser } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  userProfile: AppUser | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, displayName: string) => Promise<any>
  signInWithGoogle: () => Promise<any>
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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Database error fetching user profile:', error)
        // 사용자가 DB에 없다면 자동으로 생성 시도
        if (error.code === 'PGRST116') {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const userIdForSearch = `yellowtalk_${Math.random().toString(36).substr(2, 9)}`
            const { data: newUser, error: insertError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                email: user.email!,
                display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                user_id: userIdForSearch,
                status_message: '',
              })
              .select()
              .single()

            if (!insertError && newUser) {
              setUserProfile(newUser)
              return
            } else {
              console.error('Failed to create user profile:', insertError)
            }
          }
        }
        throw error
      }
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    } finally {
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
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    return { data, error }
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