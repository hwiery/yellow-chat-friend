-- ================================
-- 2단계: 새로운 friends 테이블 생성
-- ================================
-- Supabase SQL Editor에서 실행하세요

-- 새로운 올바른 friends 테이블 생성
CREATE TABLE public.friends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 핵심: 친구를 추가한 사람 (소유자)
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- 친구로 추가된 사람
    friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    -- 친구 추가 상태
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked')),

    -- 친구 추가한 날짜
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 제약 조건
    CONSTRAINT no_self_friend CHECK (owner_id != friend_id),
    CONSTRAINT unique_friendship UNIQUE (owner_id, friend_id)
);