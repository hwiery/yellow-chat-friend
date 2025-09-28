import { supabase, FriendWithProfile } from '@/lib/supabase'

export const friendsService = {
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
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, avatar_url, user_id, status_message')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Search user error:', error)
      return { data: null, error }
    }
  },

  async addFriend(friendUserId: string) {
    try {
      // First find the user by their user_id
      const { data: friendUser, error: searchError } = await this.searchUserByUserId(friendUserId)
      if (searchError || !friendUser) {
        throw new Error('User not found')
      }

      // Check if friendship already exists
      const { data: existingFriendship, error: checkError } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${supabase.auth.getUser().then(u => u.data.user?.id)},friend_id.eq.${friendUser.id}),and(user_id.eq.${friendUser.id},friend_id.eq.${supabase.auth.getUser().then(u => u.data.user?.id)})`)
        .maybeSingle()

      if (checkError) throw checkError
      if (existingFriendship) {
        throw new Error('Friendship already exists')
      }

      // Create friendship
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: friendUser.id,
          status: 'accepted' // Direct accept for now, can add pending later
        })
        .select()
        .single()

      if (error) throw error

      // Also create reverse friendship for bidirectional relationship
      await supabase
        .from('friends')
        .insert({
          user_id: friendUser.id,
          friend_id: user.id,
          status: 'accepted'
        })

      return { data, error: null }
    } catch (error) {
      console.error('Add friend error:', error)
      return { data: null, error }
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