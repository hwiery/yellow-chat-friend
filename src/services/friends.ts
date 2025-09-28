import { supabase, FriendWithProfile } from '@/lib/supabase'

export const friendsService = {
  // Debug function to see what users exist
  async debugListUsers() {
    try {
      console.log('🔍 Debug: Listing all users in database...')
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, user_id, email')
        .limit(10)

      if (error) {
        console.error('❌ Debug error:', error)
        return { data: [], error }
      }

      console.log('📋 All users in database:', data)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Debug list users error:', error)
      return { data: [], error }
    }
  },

  async getFriends() {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          *,
          friend_profile:friend_id (
            id,
            display_name,
            avatar_url,
            user_id,
            status_message
          )
        `)
        .eq('status', 'accepted')
        .returns<FriendWithProfile[]>()

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Get friends error:', error)
      return { data: [], error }
    }
  },

  async searchUserByUserId(userId: string) {
    try {
      console.log('🔍 Searching for user with ID:', userId)

      // First try exact match
      let { data, error } = await supabase
        .from('users')
        .select('id, display_name, avatar_url, user_id, status_message')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('🚨 Database error in search:', error)
        return { data: null, error }
      }

      if (data) {
        console.log('✅ User found (exact match):', data)
        return { data, error: null }
      }

      // Try case insensitive search
      console.log('🔍 Trying case insensitive search...')
      const { data: caseInsensitiveData, error: caseError } = await supabase
        .from('users')
        .select('id, display_name, avatar_url, user_id, status_message')
        .ilike('user_id', userId)
        .maybeSingle()

      if (caseError) {
        console.error('🚨 Database error in case insensitive search:', caseError)
        return { data: null, error: caseError }
      }

      if (caseInsensitiveData) {
        console.log('✅ User found (case insensitive):', caseInsensitiveData)
        return { data: caseInsensitiveData, error: null }
      }

      // Try wildcard search for partial matches
      console.log('🔍 Trying wildcard search...')
      const { data: wildcardData, error: wildcardError } = await supabase
        .from('users')
        .select('id, display_name, avatar_url, user_id, status_message')
        .ilike('user_id', `%${userId}%`)
        .limit(5)

      if (wildcardError) {
        console.error('🚨 Database error in wildcard search:', wildcardError)
        return { data: null, error: wildcardError }
      }

      if (wildcardData && wildcardData.length > 0) {
        console.log('✅ Found partial matches:', wildcardData)
        // Return the first match for now, could be improved to show multiple options
        return { data: wildcardData[0], error: null }
      }

      console.log('📭 No user found with any search method for ID:', userId)
      return { data: null, error: { message: `No user found with ID: ${userId}. Please check the spelling and try again.` } }
    } catch (error) {
      console.error('❌ Search user error:', error)
      return { data: null, error }
    }
  },

  async addFriend(friendUserId: string) {
    try {
      console.log('👥 Starting add friend process for:', friendUserId)

      // Get current user first
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Auth error:', authError)
        return { data: null, error: { message: 'Not authenticated' } }
      }

      console.log('✅ Current user authenticated:', user.id)

      // First find the user by their user_id
      const { data: friendUser, error: searchError } = await this.searchUserByUserId(friendUserId)
      if (searchError || !friendUser) {
        console.error('❌ Friend user not found:', searchError)
        return { data: null, error: { message: `User with ID "${friendUserId}" not found. Please check the ID and try again.` } }
      }

      console.log('✅ Friend user found:', friendUser.id)

      // Check if trying to add self
      if (friendUser.id === user.id) {
        return { data: null, error: { message: 'You cannot add yourself as a friend' } }
      }

      // Check if friendship already exists (simplified query)
      const { data: existingFriendship, error: checkError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', user.id)
        .eq('friend_id', friendUser.id)
        .maybeSingle()

      if (checkError) {
        console.error('❌ Error checking existing friendship:', checkError)
        return { data: null, error: { message: 'Error checking friendship status' } }
      }

      if (existingFriendship) {
        console.log('⚠️ Friendship already exists')
        return { data: null, error: { message: 'You are already friends with this user' } }
      }

      console.log('📝 Creating friendship...')

      // Create friendship
      const { data, error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: friendUser.id,
          status: 'accepted'
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating friendship:', error)
        return { data: null, error: { message: 'Failed to create friendship' } }
      }

      // Also create reverse friendship for bidirectional relationship
      const { error: reverseError } = await supabase
        .from('friends')
        .insert({
          user_id: friendUser.id,
          friend_id: user.id,
          status: 'accepted'
        })

      if (reverseError) {
        console.warn('⚠️ Warning: Could not create reverse friendship:', reverseError)
        // Don't fail the whole operation for this
      }

      console.log('✅ Friend added successfully!')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Add friend error:', error)
      return { data: null, error: { message: 'An unexpected error occurred while adding friend' } }
    }
  },

  async removeFriend(friendId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Remove both directions of friendship
      const { error } = await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Remove friend error:', error)
      return { error }
    }
  },

  async blockFriend(friendId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('friends')
        .update({ status: 'blocked' })
        .eq('user_id', user.id)
        .eq('friend_id', friendId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Block friend error:', error)
      return { error }
    }
  }
}