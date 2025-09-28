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
      console.log('🔍 Getting current user\'s friends list...')

      // 현재 로그인한 사용자 확인
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Not authenticated:', authError)
        return { data: [], error: { message: 'Not authenticated' } }
      }

      console.log('✅ Current user:', user.id)

      // 해당 사용자가 추가한 친구들만 조회 (owner_id 기준)
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
        .eq('owner_id', user.id)  // 핵심: 현재 사용자가 추가한 친구들만
        .eq('status', 'active')   // active 상태만
        .returns<FriendWithProfile[]>()

      if (error) {
        console.error('❌ Database error getting friends:', error)
        return { data: [], error }
      }

      console.log(`✅ Found ${data?.length || 0} friends for user ${user.id}`)
      return { data: data || [], error: null }
    } catch (error) {
      console.error('❌ Get friends error:', error)
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

      // Check if current user already added this person as friend
      const { data: existingFriendship, error: checkError } = await supabase
        .from('friends')
        .select('*')
        .eq('owner_id', user.id)      // 현재 사용자가 소유자
        .eq('friend_id', friendUser.id)  // 추가하려는 친구
        .maybeSingle()

      if (checkError) {
        console.error('❌ Error checking existing friendship:', checkError)
        return { data: null, error: { message: 'Error checking friendship status' } }
      }

      if (existingFriendship) {
        console.log('⚠️ You already added this user as friend')
        return { data: null, error: { message: 'You already added this user as friend' } }
      }

      console.log('📝 Adding user to your friends list...')

      // 단방향 친구 추가: 현재 사용자의 친구 리스트에만 추가
      const { data, error } = await supabase
        .from('friends')
        .insert({
          owner_id: user.id,      // 친구를 추가하는 사람 (소유자)
          friend_id: friendUser.id,  // 친구로 추가되는 사람
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error adding friend:', error)
        return { data: null, error: { message: 'Failed to add friend' } }
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
      console.log('🗑️ Removing friend:', friendId)

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Not authenticated:', authError)
        return { error: { message: 'Not authenticated' } }
      }

      // 현재 사용자의 친구 리스트에서만 제거 (단방향)
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('owner_id', user.id)     // 현재 사용자가 소유자
        .eq('friend_id', friendId)   // 제거할 친구

      if (error) {
        console.error('❌ Error removing friend:', error)
        return { error }
      }

      console.log('✅ Friend removed from your list')
      return { error: null }
    } catch (error) {
      console.error('❌ Remove friend error:', error)
      return { error }
    }
  },

  async blockFriend(friendId: string) {
    try {
      console.log('🚫 Blocking friend:', friendId)

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('❌ Not authenticated:', authError)
        return { error: { message: 'Not authenticated' } }
      }

      // 현재 사용자의 친구를 차단 상태로 변경
      const { error } = await supabase
        .from('friends')
        .update({ status: 'blocked' })
        .eq('owner_id', user.id)     // 현재 사용자가 소유자
        .eq('friend_id', friendId)   // 차단할 친구

      if (error) {
        console.error('❌ Error blocking friend:', error)
        return { error }
      }

      console.log('✅ Friend blocked')
      return { error: null }
    } catch (error) {
      console.error('❌ Block friend error:', error)
      return { error }
    }
  },

  // 새로운 함수: 상호 친구 확인 (A가 B를 친구로 추가했고, B도 A를 친구로 추가했는지)
  async checkMutualFriendship(friendId: string) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return { isMutual: false, error: { message: 'Not authenticated' } }
      }

      // 현재 사용자가 상대방을 친구로 추가했는지 확인
      const { data: myFriend } = await supabase
        .from('friends')
        .select('*')
        .eq('owner_id', user.id)
        .eq('friend_id', friendId)
        .eq('status', 'active')
        .maybeSingle()

      // 상대방이 현재 사용자를 친구로 추가했는지 확인
      const { data: theirFriend } = await supabase
        .from('friends')
        .select('*')
        .eq('owner_id', friendId)
        .eq('friend_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      const isMutual = !!(myFriend && theirFriend)
      console.log(`🔍 Mutual friendship check: ${isMutual}`)

      return {
        isMutual,
        iAddedThem: !!myFriend,
        theyAddedMe: !!theirFriend,
        error: null
      }
    } catch (error) {
      console.error('❌ Check mutual friendship error:', error)
      return { isMutual: false, error }
    }
  }
}