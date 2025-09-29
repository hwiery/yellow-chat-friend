-- ================================
-- 4단계: 테스트용 샘플 데이터
-- ================================
-- Supabase SQL Editor에서 실행하세요

-- 먼저 현재 사용자의 ID 확인
SELECT auth.uid() as my_user_id;

-- 데이터베이스의 모든 사용자 보기 (테스트용)
SELECT id, display_name, user_id, email
FROM public.users
LIMIT 10;

-- 샘플 친구 추가 (실제 사용자 ID로 교체하세요)
-- 예시: 현재 로그인한 사용자가 다른 사용자를 친구로 추가
/*
INSERT INTO public.friends (owner_id, friend_id, status)
VALUES (
    auth.uid(),  -- 현재 로그인한 사용자
    '상대방-사용자-UUID-여기에-입력',  -- 친구로 추가할 사용자의 UUID
    'active'
);
*/

-- 내 친구 리스트 조회
SELECT
    f.id as friendship_id,
    f.created_at as added_date,
    u.display_name,
    u.user_id,
    u.avatar_url,
    u.status_message
FROM public.friends f
JOIN public.users u ON u.id = f.friend_id
WHERE f.owner_id = auth.uid()
AND f.status = 'active'
ORDER BY f.created_at DESC;