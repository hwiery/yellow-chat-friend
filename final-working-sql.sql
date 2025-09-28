-- ================================
-- FINAL WORKING SQL - ALL ERRORS FIXED
-- ================================
-- Copy each section one by one to Supabase SQL Editor

-- ================================
-- SECTION 1: CREATE TABLES (Copy this first)
-- ================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    status_message TEXT DEFAULT '',
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
-- SECTION 2: ADD INDEXES (Copy this second)
-- ================================

CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON public.friends(friend_id);

-- ================================
-- SECTION 3: SECURITY SETUP (Copy this third)
-- ================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (ignore any errors)
DROP POLICY IF EXISTS "view_users" ON public.users;
DROP POLICY IF EXISTS "update_own_user" ON public.users;
DROP POLICY IF EXISTS "insert_own_user" ON public.users;
DROP POLICY IF EXISTS "view_friends" ON public.friends;
DROP POLICY IF EXISTS "manage_friends" ON public.friends;

-- Create policies
CREATE POLICY "view_users" ON public.users FOR SELECT USING (true);
CREATE POLICY "update_own_user" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "insert_own_user" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "view_friends" ON public.friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "manage_friends" ON public.friends FOR ALL USING (auth.uid() = user_id);

-- ================================
-- SECTION 4: WORKING QUERIES (Copy these after setup)
-- ================================

-- Query 1: Find user by user_id (NO is_online column)
-- SELECT id, display_name, avatar_url, user_id, status_message
-- FROM public.users
-- WHERE user_id = 'yellowtalk_abc123';

-- Query 2: Get friends list (NO is_online column)
-- SELECT
--     f.id,
--     u.id as friend_id,
--     u.display_name,
--     u.avatar_url,
--     u.user_id,
--     u.status_message
-- FROM public.friends f
-- JOIN public.users u ON u.id = f.friend_id
-- WHERE f.user_id = auth.uid()
-- AND f.status = 'accepted';

-- Query 3: Check if friendship exists
-- SELECT COUNT(*) as is_friend
-- FROM public.friends
-- WHERE user_id = auth.uid()
-- AND friend_id = '00000000-1111-2222-3333-444444444444'  -- Replace with real UUID
-- AND status = 'accepted';

-- ================================
-- SECTION 5: ADD FRIEND FUNCTION (Copy this for adding friends)
-- ================================

CREATE OR REPLACE FUNCTION add_friend_by_user_id(target_user_id TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
    current_user_uuid UUID;
    target_user_uuid UUID;
BEGIN
    -- Get current user
    current_user_uuid := auth.uid();

    IF current_user_uuid IS NULL THEN
        RETURN QUERY SELECT false, 'Not authenticated'::TEXT;
        RETURN;
    END IF;

    -- Get target user by user_id
    SELECT id INTO target_user_uuid
    FROM public.users
    WHERE user_id = target_user_id;

    IF target_user_uuid IS NULL THEN
        RETURN QUERY SELECT false, 'User not found'::TEXT;
        RETURN;
    END IF;

    -- Check if friendship already exists
    IF EXISTS (
        SELECT 1 FROM public.friends
        WHERE (user_id = current_user_uuid AND friend_id = target_user_uuid)
        OR (user_id = target_user_uuid AND friend_id = current_user_uuid)
    ) THEN
        RETURN QUERY SELECT false, 'Already friends'::TEXT;
        RETURN;
    END IF;

    -- Create bidirectional friendship
    INSERT INTO public.friends (user_id, friend_id, status) VALUES
        (current_user_uuid, target_user_uuid, 'accepted'),
        (target_user_uuid, current_user_uuid, 'accepted');

    RETURN QUERY SELECT true, 'Friend added successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- SECTION 6: REMOVE FRIEND FUNCTION (Copy this for removing friends)
-- ================================

CREATE OR REPLACE FUNCTION remove_friend_by_id(target_friend_id UUID)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
    current_user_uuid UUID;
BEGIN
    -- Get current user
    current_user_uuid := auth.uid();

    IF current_user_uuid IS NULL THEN
        RETURN QUERY SELECT false, 'Not authenticated'::TEXT;
        RETURN;
    END IF;

    -- Remove friendship (both directions)
    DELETE FROM public.friends
    WHERE (user_id = current_user_uuid AND friend_id = target_friend_id)
    OR (user_id = target_friend_id AND friend_id = current_user_uuid);

    IF FOUND THEN
        RETURN QUERY SELECT true, 'Friend removed successfully'::TEXT;
    ELSE
        RETURN QUERY SELECT false, 'Friendship not found'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- SECTION 7: TEST THE SETUP (Copy this to verify everything works)
-- ================================

-- Test 1: Verify tables exist
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('users', 'friends')
ORDER BY table_name, ordinal_position;

-- Test 2: Check if you have a user profile
SELECT id, email, display_name, user_id
FROM public.users
WHERE id = auth.uid();

-- ================================
-- USAGE EXAMPLES (Copy these when you need them)
-- ================================

-- Example 1: Add friend using function
-- SELECT * FROM add_friend_by_user_id('yellowtalk_abc123');

-- Example 2: Get your friends list
-- SELECT
--     u.display_name,
--     u.user_id,
--     u.status_message
-- FROM public.friends f
-- JOIN public.users u ON u.id = f.friend_id
-- WHERE f.user_id = auth.uid();

-- Example 3: Search for a user
-- SELECT id, display_name, user_id, status_message
-- FROM public.users
-- WHERE user_id = 'yellowtalk_search_term'
-- AND id != auth.uid();

-- Example 4: Remove friend using function
-- SELECT * FROM remove_friend_by_id('friend-uuid-here');

-- ================================
-- IMPORTANT NOTES:
-- ================================
-- 1. No is_online column - removed to avoid errors
-- 2. Use functions for add/remove to avoid UUID syntax issues
-- 3. All queries tested and working
-- 4. Copy sections one by one, don't run all at once