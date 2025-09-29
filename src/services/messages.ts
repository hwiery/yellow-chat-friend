import { supabase, ConversationWithMessages, Message } from '@/lib/supabase'

export const messagesService = {
  async getConversations() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages:messages(
            id,
            content,
            message_type,
            image_url,
            created_at,
            sender_id
          ),
          participant_1_profile:participant_1 (
            id,
            display_name,
            avatar_url,
            user_id
          ),
          participant_2_profile:participant_2 (
            id,
            display_name,
            avatar_url,
            user_id
          )
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      if (error) throw error

      // Transform data to include other participant info
      const conversations = data?.map(conv => ({
        ...conv,
        other_participant: conv.participant_1 === user.id
          ? conv.participant_2_profile
          : conv.participant_1_profile,
        messages: conv.messages.sort((a: { created_at: string }, b: { created_at: string }) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      })) || []

      return { data: conversations, error: null }
    } catch (error) {
      console.error('Get conversations error:', error)
      return { data: [], error }
    }
  },

  async getOrCreateConversation(friendId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if conversation exists
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${friendId}),and(participant_1.eq.${friendId},participant_2.eq.${user.id})`)
        .maybeSingle()

      if (searchError) throw searchError

      if (existingConv) {
        return { data: existingConv, error: null }
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          type: 'direct',
          participant_1: user.id,
          participant_2: friendId
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Get or create conversation error:', error)
      return { data: null, error }
    }
  },

  async getMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Get messages error:', error)
      return { data: [], error }
    }
  },

  async sendMessage(conversationId: string, content: string, messageType: 'text' | 'image' | 'emoji' = 'text', imageUrl?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: messageType,
          image_url: imageUrl
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Send message error:', error)
      return { data: null, error }
    }
  },

  async deleteConversation(conversationId: string) {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Delete conversation error:', error)
      return { error }
    }
  },

  async subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          callback(payload.new as Message)
        }
      )
      .subscribe()
  },

  async markAsRead(messageId: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Mark as read error:', error)
      return { error }
    }
  }
}