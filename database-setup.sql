-- ================================
-- YellowTalk Database Schema Setup
-- ================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- 1. USERS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    user_id VARCHAR(50) UNIQUE NOT NULL, -- Custom searchable ID like "yellowtalk_abc123"
    status_message TEXT DEFAULT '',
    is_online BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 2. FRIENDS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'blocked', 'declined')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure users can't friend themselves
    CONSTRAINT no_self_friend CHECK (user_id != friend_id),

    -- Ensure unique friendship pairs
    CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- ================================
-- 3. CONVERSATIONS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) CHECK (type IN ('direct', 'group')) DEFAULT 'direct',
    name VARCHAR(100), -- For group chats
    participant_1 UUID REFERENCES public.users(id) ON DELETE CASCADE,
    participant_2 UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    last_message_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- For direct conversations, ensure participants are different
    CONSTRAINT different_participants CHECK (
        type = 'group' OR participant_1 != participant_2
    )
);

-- ================================
-- 4. MESSAGES TABLE
-- ================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) CHECK (message_type IN ('text', 'image', 'emoji', 'file')) DEFAULT 'text',
    image_url TEXT,
    file_url TEXT,
    file_name VARCHAR(255),
    file_size INTEGER,
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    read_by JSONB DEFAULT '[]', -- Array of user IDs who have read this message
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 5. FRIEND REQUESTS TABLE (Enhanced)
-- ================================
CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')) DEFAULT 'pending',
    message TEXT, -- Optional message with friend request
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,

    -- Ensure users can't send requests to themselves
    CONSTRAINT no_self_request CHECK (sender_id != receiver_id),

    -- Ensure unique pending requests
    CONSTRAINT unique_pending_request UNIQUE (sender_id, receiver_id)
);

-- ================================
-- 6. USER BLOCKS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure users can't block themselves
    CONSTRAINT no_self_block CHECK (blocker_id != blocked_id),

    -- Ensure unique blocks
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id)
);

-- ================================
-- 7. INDEXES FOR PERFORMANCE
-- ================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON public.users(display_name);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON public.users(is_online);

-- Friends table indexes
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON public.friends(status);
CREATE INDEX IF NOT EXISTS idx_friends_user_status ON public.friends(user_id, status);

-- Conversations table indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON public.conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON public.conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);

-- Friend requests table indexes
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);

-- User blocks table indexes
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

-- ================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Friends policies
CREATE POLICY "Users can view own friends" ON public.friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can manage own friendships" ON public.friends FOR ALL USING (auth.uid() = user_id);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (
    auth.uid() = participant_1 OR auth.uid() = participant_2 OR auth.uid() = created_by
);
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (
    auth.uid() = participant_1 OR auth.uid() = participant_2 OR auth.uid() = created_by
);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = conversation_id
        AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
    )
);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Friend requests policies
CREATE POLICY "Users can view own friend requests" ON public.friend_requests FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can send friend requests" ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update received requests" ON public.friend_requests FOR UPDATE USING (auth.uid() = receiver_id);

-- User blocks policies
CREATE POLICY "Users can manage own blocks" ON public.user_blocks FOR ALL USING (auth.uid() = blocker_id);

-- ================================
-- 9. FUNCTIONS AND TRIGGERS
-- ================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_friends_updated_at BEFORE UPDATE ON public.friends FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-generate user_id when user is created
CREATE OR REPLACE FUNCTION public.generate_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NULL OR NEW.user_id = '' THEN
        NEW.user_id := 'yellowtalk_' || encode(gen_random_bytes(6), 'base64')::text;
        -- Replace URL-unsafe characters
        NEW.user_id := replace(replace(NEW.user_id, '/', ''), '+', '');
        NEW.user_id := lower(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER auto_generate_user_id BEFORE INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.generate_user_id();

-- Function to update conversation last_message_at when message is added
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_last_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- Function to handle friend request acceptance
CREATE OR REPLACE FUNCTION public.accept_friend_request(request_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    req RECORD;
BEGIN
    -- Get the friend request
    SELECT * INTO req FROM public.friend_requests WHERE id = request_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check if users are not already friends
    IF EXISTS (
        SELECT 1 FROM public.friends
        WHERE (user_id = req.sender_id AND friend_id = req.receiver_id)
        OR (user_id = req.receiver_id AND friend_id = req.sender_id)
    ) THEN
        RETURN FALSE;
    END IF;

    -- Create bidirectional friendship
    INSERT INTO public.friends (user_id, friend_id, status) VALUES
        (req.sender_id, req.receiver_id, 'accepted'),
        (req.receiver_id, req.sender_id, 'accepted');

    -- Update request status
    UPDATE public.friend_requests
    SET status = 'accepted', responded_at = NOW()
    WHERE id = request_id;

    RETURN TRUE;
END;
$$ language 'plpgsql';

-- ================================
-- 10. SAMPLE DATA (Optional)
-- ================================

-- You can uncomment this section to add sample data for testing

/*
-- Insert sample users (these will be created automatically when users sign up via Supabase Auth)
INSERT INTO public.users (id, email, display_name, user_id, status_message) VALUES
    ('00000000-0000-0000-0000-000000000001', 'user1@example.com', 'Alice Johnson', 'yellowtalk_alice', 'Hello from Alice!'),
    ('00000000-0000-0000-0000-000000000002', 'user2@example.com', 'Bob Smith', 'yellowtalk_bob', 'Bob here 👋'),
    ('00000000-0000-0000-0000-000000000003', 'user3@example.com', 'Charlie Brown', 'yellowtalk_charlie', 'Ready to chat!')
ON CONFLICT (id) DO NOTHING;

-- Insert sample friendships
INSERT INTO public.friends (user_id, friend_id, status) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'accepted'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'accepted')
ON CONFLICT (user_id, friend_id) DO NOTHING;
*/

-- ================================
-- SETUP COMPLETE
-- ================================

-- Verify tables were created
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'friends', 'conversations', 'messages', 'friend_requests', 'user_blocks')
ORDER BY table_name;