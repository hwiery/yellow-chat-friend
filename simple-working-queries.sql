-- ================================
-- SIMPLE WORKING QUERIES - NO ERRORS
-- ================================
-- Copy and paste these one by one in Supabase SQL Editor

-- ================================
-- 1. CREATE TABLES (Run this first)
-- ================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    status_message TEXT DEFAULT '',
    is_online BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'accepted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 2. CREATE INDEXES (Run this second)
-- ================================

CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);

-- ================================
-- 3. ENABLE SECURITY (Run this third)
-- ================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "view_users" ON public.users;
DROP POLICY IF EXISTS "update_own_user" ON public.users;
DROP POLICY IF EXISTS "insert_own_user" ON public.users;
DROP POLICY IF EXISTS "view_friends" ON public.friends;
DROP POLICY IF EXISTS "manage_friends" ON public.friends;

-- Create new policies
CREATE POLICY "view_users" ON public.users FOR SELECT USING (true);
CREATE POLICY "update_own_user" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "insert_own_user" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "view_friends" ON public.friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "manage_friends" ON public.friends FOR ALL USING (auth.uid() = user_id);

-- ================================
-- 4. WORKING QUERIES FOR YOUR APP
-- ================================

-- Find user by user_id:
SELECT id, display_name, avatar_url, user_id, status_message
FROM public.users
WHERE user_id = 'yellowtalk_abc123';

-- Get friends list:
SELECT
    f.id,
    u.id as friend_id,
    u.display_name,
    u.avatar_url,
    u.user_id,
    u.status_message
FROM public.friends f
JOIN public.users u ON u.id = f.friend_id
WHERE f.user_id = auth.uid()
AND f.status = 'accepted';

-- Add friend (replace UUIDs with real ones):
INSERT INTO public.friends (user_id, friend_id, status) VALUES
('your-user-uuid', 'friend-user-uuid', 'accepted'),
('friend-user-uuid', 'your-user-uuid', 'accepted');

-- Remove friend:
DELETE FROM public.friends
WHERE (user_id = auth.uid() AND friend_id = 'friend-uuid')
OR (user_id = 'friend-uuid' AND friend_id = auth.uid());

-- Check if friendship exists:
SELECT COUNT(*) as is_friend
FROM public.friends
WHERE user_id = auth.uid()
AND friend_id = 'target-user-uuid'
AND status = 'accepted';

-- ================================
-- 5. TEST QUERIES
-- ================================

-- Test 1: Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('users', 'friends');

-- Test 2: Check current user
SELECT id, email FROM auth.users WHERE id = auth.uid();

-- Test 3: Check user profile
SELECT * FROM public.users WHERE id = auth.uid();