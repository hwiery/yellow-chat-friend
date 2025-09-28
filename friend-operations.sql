-- ================================
-- FRIEND SYSTEM OPERATIONS SQL
-- ================================

-- ================================
-- 1. SEARCH USERS
-- ================================

-- Search user by custom user_id (like "yellowtalk_abc123")
-- Usage: Replace 'yellowtalk_alice' with the actual user_id you're searching for
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
-- 2. SEND FRIEND REQUEST
-- ================================

-- Check if friendship or request already exists
-- Replace the UUIDs with actual user IDs
WITH current_user AS (
    SELECT auth.uid() as id
),
target_user AS (
    SELECT id FROM public.users WHERE user_id = 'yellowtalk_bob'
)
SELECT
    CASE
        WHEN f.id IS NOT NULL THEN 'already_friends'
        WHEN fr.id IS NOT NULL AND fr.status = 'pending' THEN 'request_pending'
        WHEN fr.id IS NOT NULL AND fr.status = 'declined' THEN 'request_declined'
        WHEN ub.id IS NOT NULL THEN 'user_blocked'
        ELSE 'can_send_request'
    END as relationship_status
FROM current_user cu
CROSS JOIN target_user tu
LEFT JOIN public.friends f ON (
    (f.user_id = cu.id AND f.friend_id = tu.id) OR
    (f.user_id = tu.id AND f.friend_id = cu.id)
) AND f.status = 'accepted'
LEFT JOIN public.friend_requests fr ON (
    (fr.sender_id = cu.id AND fr.receiver_id = tu.id) OR
    (fr.sender_id = tu.id AND fr.receiver_id = cu.id)
) AND fr.status IN ('pending', 'declined')
LEFT JOIN public.user_blocks ub ON (
    (ub.blocker_id = cu.id AND ub.blocked_id = tu.id) OR
    (ub.blocker_id = tu.id AND ub.blocked_id = cu.id)
);

-- Send friend request
-- Replace 'yellowtalk_bob' with target user_id and optional message
INSERT INTO public.friend_requests (sender_id, receiver_id, message)
SELECT
    auth.uid(),
    u.id,
    'Hi! Let''s be friends on YellowTalk!' -- Optional message
FROM public.users u
WHERE u.user_id = 'yellowtalk_bob'
AND u.id != auth.uid()
AND NOT EXISTS (
    -- Check no existing friendship
    SELECT 1 FROM public.friends f
    WHERE (f.user_id = auth.uid() AND f.friend_id = u.id)
    OR (f.user_id = u.id AND f.friend_id = auth.uid())
)
AND NOT EXISTS (
    -- Check no pending request
    SELECT 1 FROM public.friend_requests fr
    WHERE (fr.sender_id = auth.uid() AND fr.receiver_id = u.id)
    OR (fr.sender_id = u.id AND fr.receiver_id = auth.uid())
    AND fr.status = 'pending'
);

-- ================================
-- 3. VIEW FRIEND REQUESTS
-- ================================

-- View incoming friend requests (requests I received)
SELECT
    fr.id,
    fr.message,
    fr.created_at,
    u.display_name as sender_name,
    u.avatar_url as sender_avatar,
    u.user_id as sender_user_id,
    u.status_message as sender_status
FROM public.friend_requests fr
JOIN public.users u ON u.id = fr.sender_id
WHERE fr.receiver_id = auth.uid()
AND fr.status = 'pending'
ORDER BY fr.created_at DESC;

-- View outgoing friend requests (requests I sent)
SELECT
    fr.id,
    fr.message,
    fr.created_at,
    fr.status,
    u.display_name as receiver_name,
    u.avatar_url as receiver_avatar,
    u.user_id as receiver_user_id
FROM public.friend_requests fr
JOIN public.users u ON u.id = fr.receiver_id
WHERE fr.sender_id = auth.uid()
AND fr.status IN ('pending', 'declined')
ORDER BY fr.created_at DESC;

-- ================================
-- 4. ACCEPT FRIEND REQUEST
-- ================================

-- Accept friend request using the built-in function
-- Replace 'request-uuid-here' with actual request ID
SELECT public.accept_friend_request('request-uuid-here');

-- Manual way to accept friend request
WITH accepted_request AS (
    UPDATE public.friend_requests
    SET status = 'accepted', responded_at = NOW()
    WHERE id = 'request-uuid-here'
    AND receiver_id = auth.uid()
    AND status = 'pending'
    RETURNING sender_id, receiver_id
)
INSERT INTO public.friends (user_id, friend_id, status)
SELECT sender_id, receiver_id, 'accepted' FROM accepted_request
UNION ALL
SELECT receiver_id, sender_id, 'accepted' FROM accepted_request;

-- ================================
-- 5. DECLINE FRIEND REQUEST
-- ================================

UPDATE public.friend_requests
SET status = 'declined', responded_at = NOW()
WHERE id = 'request-uuid-here'
AND receiver_id = auth.uid()
AND status = 'pending';

-- ================================
-- 6. CANCEL SENT FRIEND REQUEST
-- ================================

UPDATE public.friend_requests
SET status = 'cancelled'
WHERE id = 'request-uuid-here'
AND sender_id = auth.uid()
AND status = 'pending';

-- ================================
-- 7. VIEW FRIENDS LIST
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

-- Get friends with last conversation info
SELECT
    f.id as friendship_id,
    u.id as friend_id,
    u.display_name,
    u.avatar_url,
    u.user_id,
    u.status_message,
    u.is_online,
    u.last_seen_at,
    c.id as conversation_id,
    c.last_message_at,
    m.content as last_message,
    m.sender_id as last_message_sender
FROM public.friends f
JOIN public.users u ON u.id = f.friend_id
LEFT JOIN public.conversations c ON (
    (c.participant_1 = auth.uid() AND c.participant_2 = u.id) OR
    (c.participant_1 = u.id AND c.participant_2 = auth.uid())
) AND c.type = 'direct'
LEFT JOIN public.messages m ON m.id = (
    SELECT id FROM public.messages
    WHERE conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
)
WHERE f.user_id = auth.uid()
AND f.status = 'accepted'
ORDER BY COALESCE(c.last_message_at, f.created_at) DESC;

-- ================================
-- 8. REMOVE FRIEND
-- ================================

-- Remove friendship (both directions)
DELETE FROM public.friends
WHERE (user_id = auth.uid() AND friend_id = 'friend-uuid-here')
OR (user_id = 'friend-uuid-here' AND friend_id = auth.uid());

-- Alternative: Just change status to 'blocked' instead of deleting
UPDATE public.friends
SET status = 'blocked'
WHERE user_id = auth.uid()
AND friend_id = 'friend-uuid-here';

-- ================================
-- 9. BLOCK USER
-- ================================

-- Block a user (removes friendship if exists)
WITH blocked_user AS (
    INSERT INTO public.user_blocks (blocker_id, blocked_id, reason)
    VALUES (auth.uid(), 'user-uuid-to-block', 'Inappropriate behavior')
    RETURNING blocked_id
)
DELETE FROM public.friends
WHERE (user_id = auth.uid() AND friend_id = (SELECT blocked_id FROM blocked_user))
OR (user_id = (SELECT blocked_id FROM blocked_user) AND friend_id = auth.uid());

-- ================================
-- 10. UNBLOCK USER
-- ================================

DELETE FROM public.user_blocks
WHERE blocker_id = auth.uid()
AND blocked_id = 'user-uuid-to-unblock';

-- ================================
-- 11. GET FRIEND SUGGESTIONS
-- ================================

-- Get users who are not friends and not blocked
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
)
AND NOT EXISTS (
    -- No pending friend request
    SELECT 1 FROM public.friend_requests fr
    WHERE (fr.sender_id = auth.uid() AND fr.receiver_id = u.id)
    OR (fr.sender_id = u.id AND fr.receiver_id = auth.uid())
    AND fr.status = 'pending'
)
AND NOT EXISTS (
    -- Not blocked
    SELECT 1 FROM public.user_blocks ub
    WHERE (ub.blocker_id = auth.uid() AND ub.blocked_id = u.id)
    OR (ub.blocker_id = u.id AND ub.blocked_id = auth.uid())
)
ORDER BY u.created_at DESC
LIMIT 10;

-- ================================
-- 12. GET FRIEND COUNTS
-- ================================

-- Get various counts for current user
SELECT
    (SELECT COUNT(*) FROM public.friends WHERE user_id = auth.uid() AND status = 'accepted') as friends_count,
    (SELECT COUNT(*) FROM public.friend_requests WHERE receiver_id = auth.uid() AND status = 'pending') as incoming_requests,
    (SELECT COUNT(*) FROM public.friend_requests WHERE sender_id = auth.uid() AND status = 'pending') as outgoing_requests,
    (SELECT COUNT(*) FROM public.user_blocks WHERE blocker_id = auth.uid()) as blocked_users;

-- ================================
-- USAGE EXAMPLES
-- ================================

/*
Example workflow for adding a friend:

1. Search for user:
   - Use user_id search query with 'yellowtalk_bob'

2. Check relationship status:
   - Run relationship status check query

3. If can_send_request, send request:
   - Use send friend request query

4. Target user sees incoming request:
   - Use view incoming requests query

5. Target user accepts:
   - Use accept friend request query

6. Both users can now see each other in friends list:
   - Use view friends list query
*/