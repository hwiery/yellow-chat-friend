import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a mock client for development/fallback
const createMockClient = () => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    signInWithOAuth: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    signOut: () => Promise.resolve({ error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null })
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
    insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
    update: () => ({ eq: () => Promise.resolve({ error: { message: 'Supabase not configured' } }) })
  })
})

let supabase: any; // eslint-disable-line @typescript-eslint/no-explicit-any

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Using mock client.')
  supabase = createMockClient()
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
}

export { supabase }

// Database Types
export interface User {
  id: string
  email: string
  display_name: string
  avatar_url?: string
  user_id: string // Custom user ID for friend search
  status_message?: string
  created_at: string
  updated_at: string
}

export interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
}

export interface Conversation {
  id: string
  type: 'direct' | 'group'
  participant_1: string
  participant_2: string
  last_message_at?: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'emoji'
  image_url?: string
  created_at: string
  read_at?: string
}

export interface FriendWithProfile extends Friend {
  friend_profile: User
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
  other_participant: User
}