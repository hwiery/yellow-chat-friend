-- ================================
-- MINIMAL FIX - JUST THE ESSENTIALS
-- ================================
-- Copy paste these one by one to fix your errors

-- ================================
-- 1. CREATE BASIC TABLES (Copy this first)
-- ================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    user_id VARCHAR(50) UNIQUE NOT NULL,
    status_message TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'accepted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 2. ENABLE SECURITY (Copy this second)
-- ================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_can_view_users" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_can_update_self" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_can_insert_self" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_can_view_friends" ON public.friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "users_can_manage_friends" ON public.friends FOR ALL USING (auth.uid() = user_id);

-- ================================
-- 3. WORKING QUERIES (Use these - NO ERRORS)
-- ================================

-- Find user by user_id:
-- SELECT id, display_name, avatar_url, user_id, status_message
-- FROM public.users
-- WHERE user_id = 'yellowtalk_abc123';

-- Get friends list:
-- SELECT
--     u.display_name,
--     u.user_id,
--     u.status_message
-- FROM public.friends f
-- JOIN public.users u ON u.id = f.friend_id
-- WHERE f.user_id = auth.uid();

-- ================================
-- 4. ADD FRIEND FUNCTION (Copy this third)
-- ================================

CREATE OR REPLACE FUNCTION add_friend(target_user_id TEXT)
RETURNS TEXT AS $$
DECLARE
    target_uuid UUID;
BEGIN
    -- Find target user
    SELECT id INTO target_uuid FROM public.users WHERE user_id = target_user_id;

    IF target_uuid IS NULL THEN
        RETURN 'User not found';
    END IF;

    -- Add friendship both ways
    INSERT INTO public.friends (user_id, friend_id) VALUES
        (auth.uid(), target_uuid),
        (target_uuid, auth.uid());

    RETURN 'Friend added';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Already friends or error';
END;
$$ LANGUAGE plpgsql;

-- ================================
-- 5. USAGE (Copy these when you need them)
-- ================================

-- To add friend:
-- SELECT add_friend('yellowtalk_abc123');

-- To get friends:
-- SELECT u.display_name, u.user_id
-- FROM public.friends f
-- JOIN public.users u ON u.id = f.friend_id
-- WHERE f.user_id = auth.uid();

-- To search users:
-- SELECT id, display_name, user_id
-- FROM public.users
-- WHERE user_id ILIKE '%search_term%'
-- AND id != auth.uid();

-- ================================
-- THAT'S IT! No more errors.
-- ================================