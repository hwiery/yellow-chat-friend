-- ================================
-- FIXED FRIEND SYSTEM OPERATIONS SQL
-- ================================
-- These queries are tested and working with Supabase

-- ================================
-- 1. SEARCH USERS (FIXED)
-- ================================

-- Search user by custom user_id (like "yellowtalk_abc123")
-- Replace 'yellowtalk_alice' with the actual user_id you're searching for
SELECT
    id,
    display_name,
    avatar_url,
    user_id,
    status_message,
    is_online,
    last_seen_at
FROM public.users
WHERE user_id = 'yellowtalk_alice'
AND id != auth.uid(); -- Don't return current user

-- Search users by display name (partial match)
SELECT
    id,
    display_name,
    avatar_url,
    user_id,
    status_message,
    is_online
FROM public.users
WHERE LOWER(display_name) LIKE LOWER('%alice%')
AND id != auth.uid()
ORDER BY display_name
LIMIT 20;

-- ================================
-- 2. ADD FRIEND DIRECTLY (SIMPLIFIED)
-- ================================

-- Simple way to add friend (what your current app does)
-- Replace 'yellowtalk_bob' with the target user_id
DO $$
DECLARE
    current_user_uuid UUID;
    target_user_uuid UUID;
BEGIN
    -- Get current user
    current_user_uuid := auth.uid();

    -- Get target user by user_id
    SELECT id INTO target_user_uuid
    FROM public.users
    WHERE user_id = 'yellowtalk_bob';

    -- Check if friendship already exists
    IF NOT EXISTS (
        SELECT 1 FROM public.friends
        WHERE (user_id = current_user_uuid AND friend_id = target_user_uuid)
        OR (user_id = target_user_uuid AND friend_id = current_user_uuid)
    ) THEN
        -- Create bidirectional friendship
        INSERT INTO public.friends (user_id, friend_id, status) VALUES
            (current_user_uuid, target_user_uuid, 'accepted'),
            (target_user_uuid, current_user_uuid, 'accepted');

        RAISE NOTICE 'Friendship created successfully';
    ELSE
        RAISE NOTICE 'Friendship already exists';
    END IF;
END $$;

-- ================================
-- 3. VIEW FRIENDS LIST (FIXED)
-- ================================

-- Get all friends with their profiles
SELECT
    f.id as friendship_id,
    f.created_at as friends_since,
    u.id as friend_id,
    u.display_name,
    u.avatar_url,
    u.user_id,
    u.status_message,
    u.is_online,
    u.last_seen_at
FROM public.friends f
JOIN public.users u ON u.id = f.friend_id
WHERE f.user_id = auth.uid()
AND f.status = 'accepted'
ORDER BY u.display_name;

-- ================================
-- 4. REMOVE FRIEND (FIXED)
-- ================================

-- Remove friendship (both directions)
-- Replace 'friend-uuid-here' with actual friend's UUID
DELETE FROM public.friends
WHERE (user_id = auth.uid() AND friend_id = 'friend-uuid-here')
OR (user_id = 'friend-uuid-here' AND friend_id = auth.uid());

-- ================================
-- 5. CHECK IF USERS ARE FRIENDS
-- ================================

-- Check friendship status between current user and target user_id
-- Replace 'yellowtalk_bob' with target user_id
SELECT
    CASE
        WHEN COUNT(*) > 0 THEN 'friends'
        ELSE 'not_friends'
    END as relationship_status
FROM public.friends f
JOIN public.users u ON u.id = f.friend_id
WHERE f.user_id = auth.uid()
AND u.user_id = 'yellowtalk_bob'
AND f.status = 'accepted';

-- ================================
-- 6. GET USER BY USER_ID (FIXED)
-- ================================

-- Simple function to get user by their custom user_id
SELECT
    id,
    email,
    display_name,
    avatar_url,
    user_id,
    status_message,
    is_online,
    created_at
FROM public.users
WHERE user_id = 'yellowtalk_abc123';

-- ================================
-- 7. GET FRIEND SUGGESTIONS (FIXED)
-- ================================

-- Get users who are not friends yet
SELECT
    u.id,
    u.display_name,
    u.avatar_url,
    u.user_id,
    u.status_message,
    u.is_online
FROM public.users u
WHERE u.id != auth.uid()
AND NOT EXISTS (
    -- Not already friends
    SELECT 1 FROM public.friends f
    WHERE (f.user_id = auth.uid() AND f.friend_id = u.id)
    OR (f.user_id = u.id AND f.friend_id = auth.uid())
    AND f.status = 'accepted'
)
ORDER BY u.created_at DESC
LIMIT 10;

-- ================================
-- 8. GET FRIEND COUNT (FIXED)
-- ================================

-- Get number of friends for current user
SELECT COUNT(*) as friends_count
FROM public.friends
WHERE user_id = auth.uid()
AND status = 'accepted';

-- ================================
-- 9. WORKING EXAMPLES FOR YOUR APP
-- ================================

/*
-- Example 1: Search for a user by their user_id
SELECT id, display_name, avatar_url, user_id, status_message
FROM public.users
WHERE user_id = 'yellowtalk_alice123'
AND id != auth.uid();

-- Example 2: Add user as friend (using their UUID from search above)
INSERT INTO public.friends (user_id, friend_id, status) VALUES
    (auth.uid(), 'target-user-uuid-here', 'accepted'),
    ('target-user-uuid-here', auth.uid(), 'accepted');

-- Example 3: Get my friends list
SELECT
    f.id as friendship_id,
    u.id as friend_id,
    u.display_name,
    u.avatar_url,
    u.user_id,
    u.status_message
FROM public.friends f
JOIN public.users u ON u.id = f.friend_id
WHERE f.user_id = auth.uid()
AND f.status = 'accepted'
ORDER BY u.display_name;

-- Example 4: Remove a friend
DELETE FROM public.friends
WHERE (user_id = auth.uid() AND friend_id = 'friend-uuid-to-remove')
OR (user_id = 'friend-uuid-to-remove' AND friend_id = auth.uid());
*/

-- ================================
-- SIMPLE TESTING QUERIES
-- ================================

-- Test if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'friends');

-- Test if current user exists
SELECT id, display_name, user_id
FROM public.users
WHERE id = auth.uid();