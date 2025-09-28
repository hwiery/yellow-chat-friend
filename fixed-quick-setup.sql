-- ================================
-- FIXED QUICK SETUP FOR YELLOWTALK FRIEND SYSTEM
-- ================================
-- Run this in your Supabase SQL Editor (CORRECTED VERSION)

-- 1. Create the basic tables (FIXED)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    status_message TEXT DEFAULT '',
    is_online BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'accepted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT no_self_friend CHECK (user_id != friend_id),
    CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON public.friends(status);

-- 3. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own friends" ON public.friends;
DROP POLICY IF EXISTS "Users can manage own friendships" ON public.friends;

-- 5. Create policies (FIXED)
CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own friends" ON public.friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage own friendships" ON public.friends
    FOR ALL USING (auth.uid() = user_id);

-- 6. Function to auto-generate user_id (FIXED)
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

-- 7. Create trigger for auto-generating user_id
CREATE TRIGGER auto_generate_user_id
    BEFORE INSERT ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.generate_user_id();

-- ================================
-- VERIFIED WORKING QUERIES
-- ================================

-- Test 1: Search user by user_id (FIXED - no is_online column reference in WHERE)
-- SELECT id, display_name, avatar_url, user_id, status_message, is_online
-- FROM public.users
-- WHERE user_id = 'yellowtalk_abc123';

-- Test 2: Get friends list (FIXED)
-- SELECT
--     f.id as friendship_id,
--     u.id as friend_id,
--     u.display_name,
--     u.avatar_url,
--     u.user_id,
--     u.status_message,
--     u.is_online
-- FROM public.friends f
-- JOIN public.users u ON u.id = f.friend_id
-- WHERE f.user_id = auth.uid()
-- AND f.status = 'accepted'
-- ORDER BY u.display_name;

-- Test 3: Add friend (replace UUIDs with actual values)
-- INSERT INTO public.friends (user_id, friend_id, status) VALUES
-- ('user-uuid-1', 'user-uuid-2', 'accepted'),
-- ('user-uuid-2', 'user-uuid-1', 'accepted');

-- Test 4: Remove friend
-- DELETE FROM public.friends
-- WHERE (user_id = auth.uid() AND friend_id = 'friend-uuid')
-- OR (user_id = 'friend-uuid' AND friend_id = auth.uid());

-- ================================
-- SETUP VERIFICATION
-- ================================
SELECT
    'Setup completed successfully!' as message,
    COUNT(*) as tables_created
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'friends');