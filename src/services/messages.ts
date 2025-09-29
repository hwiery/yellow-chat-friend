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
      console.log('💬 Getting or creating conversation with friend:', friendId)

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('❌ Auth error in getOrCreateConversation:', authError)
        throw authError
      }
      if (!user) {
        console.error('❌ No user found in getOrCreateConversation')
        throw new Error('Not authenticated')
      }

      console.log('✅ User authenticated for conversation:', user.id)

      // Check if conversation exists
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${friendId}),and(participant_1.eq.${friendId},participant_2.eq.${user.id})`)
        .maybeSingle()

      if (searchError) {
        console.error('❌ Error searching for existing conversation:', searchError)
        throw searchError
      }

      if (existingConv) {
        console.log('✅ Found existing conversation:', existingConv.id)
        return { data: existingConv, error: null }
      }

      console.log('📝 Creating new conversation between:', user.id, 'and', friendId)

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

      if (error) {
        console.error('❌ Database error creating conversation:', error)
        throw error
      }

      console.log('✅ Conversation created successfully:', data.id)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Get or create conversation error:', error)
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
      console.log('📤 Sending message:', { conversationId, content, messageType, imageUrl })

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error('❌ Auth error in sendMessage:', authError)
        throw authError
      }
      if (!user) {
        console.error('❌ No user found in sendMessage')
        throw new Error('Not authenticated')
      }

      console.log('✅ User authenticated for message sending:', user.id)

      // Check if conversation exists
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single()

      if (convError || !conversation) {
        console.error('❌ Conversation not found:', convError)
        throw new Error('Conversation not found')
      }

      console.log('✅ Conversation found:', conversation.id)

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

      if (error) {
        console.error('❌ Database error sending message:', error)
        throw error
      }

      console.log('✅ Message sent successfully:', data)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Send message error:', error)
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