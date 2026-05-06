-- 핏자워크라운지 어드민 DB 스키마
-- Supabase SQL Editor에 붙여넣고 실행하세요

-- 이벤트 관리
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  type VARCHAR DEFAULT '자체기획',
  start_date DATE,
  end_date DATE,
  time VARCHAR,
  duration VARCHAR,
  space_setup VARCHAR,
  expected_attendees INTEGER,
  revenue BIGINT,
  partner VARCHAR,
  status VARCHAR DEFAULT '기획중',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 멤버십 월별 현황 (1개월권, 4시간권)
CREATE TABLE membership_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  monthly_pass_count INTEGER DEFAULT 0,
  four_hour_pass_count INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(year, month)
);

-- 1일권 일자별 방문 로그
CREATE TABLE daily_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_date DATE NOT NULL,
  visitor_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SNS 콘텐츠 캘린더
CREATE TABLE sns_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_date DATE,
  content_type VARCHAR,
  topic TEXT,
  caption_direction TEXT,
  status VARCHAR DEFAULT '미정',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 프로모션 계획
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER,
  name VARCHAR,
  target_pass VARCHAR,
  description TEXT,
  period VARCHAR,
  target_count INTEGER,
  status VARCHAR DEFAULT '기획 전',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 비활성화 (내부 어드민용 — 나중에 로그인 기능 추가 시 변경)
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE membership_monthly DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE sns_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;

-- 초기 이벤트 데이터 (확정/기획중 이벤트)
INSERT INTO events (name, type, start_date, end_date, time, duration, partner, status, notes) VALUES
  ('공간한조각 전시', '외부협업', '2026-05-17', '2026-05-23', NULL, '1주일', '공간한조각', '확정', '전시 기간 운영'),
  ('도자모임', '외부협업', '2026-05-09', '2026-05-30', '10:30', '매주 토요일 4회', NULL, '확정', '4주 연속 프로그램'),
  ('도넛북스클럽', '자체+협업', '2026-06-04', '2026-06-25', '19:30', '매주 목요일 4회', '도넛북스', '기획중', '6월 매주 목요일');
