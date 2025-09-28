-- ================================
-- 올바른 친구 관계 시스템 스키마
-- ================================

-- 기존 잘못된 friends 테이블 삭제
DROP TABLE IF EXISTS public.friends CASCADE;

-- 새로운 올바른 friends 테이블 생성
CREATE TABLE public.friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 핵심: 친구를 추가한 사람 (소유자)
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- 친구로 추가된 사람
    friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- 친구 추가 상태 (나중에 친구 요청 기능용)
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked')),

    -- 친구 추가한 날짜
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 제약 조건
    CONSTRAINT no_self_friend CHECK (owner_id != friend_id),
    CONSTRAINT unique_friendship UNIQUE (owner_id, friend_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_friends_owner_id ON public.friends(owner_id);
CREATE INDEX idx_friends_friend_id ON public.friends(friend_id);
CREATE INDEX idx_friends_owner_status ON public.friends(owner_id, status);

-- RLS 정책 설정
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "view_friends" ON public.friends;
DROP POLICY IF EXISTS "manage_friends" ON public.friends;

-- 새로운 정책: 사용자는 자신의 친구 리스트만 볼 수 있음
CREATE POLICY "users_can_view_own_friends" ON public.friends
    FOR SELECT USING (auth.uid() = owner_id);

-- 새로운 정책: 사용자는 자신의 친구 리스트만 관리할 수 있음
CREATE POLICY "users_can_manage_own_friends" ON public.friends
    FOR ALL USING (auth.uid() = owner_id);

-- ================================
-- 사용 예시 (올바른 구조)
-- ================================

/*
-- 사용자 A가 사용자 B를 친구로 추가:
INSERT INTO public.friends (owner_id, friend_id)
VALUES ('user-a-uuid', 'user-b-uuid');

-- 사용자 B가 사용자 A를 친구로 추가 (별도 작업):
INSERT INTO public.friends (owner_id, friend_id)
VALUES ('user-b-uuid', 'user-a-uuid');

-- 사용자 A의 친구 리스트 조회:
SELECT f.*, u.display_name, u.user_id, u.avatar_url
FROM public.friends f
JOIN public.users u ON u.id = f.friend_id
WHERE f.owner_id = 'user-a-uuid' AND f.status = 'active';

-- 사용자 B의 친구 리스트 조회:
SELECT f.*, u.display_name, u.user_id, u.avatar_url
FROM public.friends f
JOIN public.users u ON u.id = f.friend_id
WHERE f.owner_id = 'user-b-uuid' AND f.status = 'active';
*/

-- 검증 쿼리
SELECT
    'Schema updated successfully!' as message,
    COUNT(*) as friends_table_exists
FROM information_schema.tables
WHERE table_name = 'friends' AND table_schema = 'public';