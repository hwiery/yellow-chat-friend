-- ================================
-- 3단계: 인덱스 및 보안 설정
-- ================================
-- Supabase SQL Editor에서 실행하세요

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_friends_owner_id ON public.friends(owner_id);
CREATE INDEX idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX idx_friends_owner_status ON public.friends(owner_id, status);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "view_friends" ON public.friends;
DROP POLICY IF EXISTS "manage_friends" ON public.friends;
DROP POLICY IF EXISTS "users_can_view_own_friends" ON public.friends;
DROP POLICY IF EXISTS "users_can_manage_own_friends" ON public.friends;

-- 새로운 정책: 사용자는 자신의 친구 리스트만 볼 수 있음
CREATE POLICY "users_can_view_own_friends" ON public.friends
    FOR SELECT USING (auth.uid() = owner_id);

-- 새로운 정책: 사용자는 자신의 친구 리스트만 관리할 수 있음
CREATE POLICY "users_can_manage_own_friends" ON public.friends
    FOR ALL USING (auth.uid() = owner_id);