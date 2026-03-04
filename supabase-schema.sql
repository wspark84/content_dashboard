-- Supabase 테이블 생성 SQL for 멍냥바이럴
-- Supabase Dashboard > SQL Editor에서 실행

-- 크롤링된 원본 게시글
CREATE TABLE IF NOT EXISTS raw_posts (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  board TEXT,
  title TEXT NOT NULL,
  body TEXT,
  url TEXT,
  author TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  crawled_at TIMESTAMPTZ DEFAULT now(),
  keywords JSONB,
  sentiment TEXT,
  UNIQUE(source, url)
);

-- 추출된 트렌딩 주제
CREATE TABLE IF NOT EXISTS trending_topics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date TEXT NOT NULL,
  keyword TEXT NOT NULL,
  cluster TEXT,
  score REAL DEFAULT 0,
  community_heat REAL DEFAULT 0,
  search_volume INTEGER DEFAULT 0,
  global_trend REAL DEFAULT 0,
  feed_match_count INTEGER DEFAULT 0,
  timeliness REAL DEFAULT 0,
  competition_gap REAL DEFAULT 0,
  sources JSONB,
  sample_questions JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, keyword)
);

-- 생성된 콘텐츠
CREATE TABLE IF NOT EXISTS contents (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  topic_id BIGINT REFERENCES trending_topics(id),
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  html TEXT,
  images JSONB,
  tags JSONB,
  feed_products JSONB,
  status TEXT DEFAULT 'draft',
  reviewer TEXT,
  review_note TEXT,
  published_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 성과 추적
CREATE TABLE IF NOT EXISTS performance (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_id BIGINT REFERENCES contents(id),
  date TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  cta_clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0,
  keywords JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(content_id, date)
);

-- A/B 테스트
CREATE TABLE IF NOT EXISTS ab_tests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  test_type TEXT NOT NULL,
  variant_a TEXT,
  variant_b TEXT,
  content_a_id BIGINT,
  content_b_id BIGINT,
  winner TEXT,
  metric TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running'
);

-- 팀 활동 로그
CREATE TABLE IF NOT EXISTS team_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_role TEXT,
  action TEXT,
  content_id BIGINT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 학습된 규칙
CREATE TABLE IF NOT EXISTS learned_rules (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category TEXT,
  rule TEXT,
  confidence REAL,
  sample_size INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_raw_posts_source ON raw_posts(source, crawled_at);
CREATE INDEX IF NOT EXISTS idx_trending_date ON trending_topics(date, score DESC);
CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status, type);
CREATE INDEX IF NOT EXISTS idx_performance_date ON performance(date);

-- RLS 활성화 (모든 테이블)
ALTER TABLE raw_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE learned_rules ENABLE ROW LEVEL SECURITY;

-- anon 사용자에게 읽기/쓰기 허용 (대시보드용)
CREATE POLICY "Allow all for anon" ON raw_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON trending_topics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON contents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON performance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON ab_tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON team_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON learned_rules FOR ALL USING (true) WITH CHECK (true);
