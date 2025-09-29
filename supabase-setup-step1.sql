-- ================================
-- 1단계: 기존 friends 테이블 삭제
-- ================================
-- Supabase SQL Editor에서 실행하세요

-- 기존 잘못된 friends 테이블 삭제 (외래 키 제약 조건 때문에 CASCADE 사용)
DROP TABLE IF EXISTS public.friends CASCADE;