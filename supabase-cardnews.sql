-- 카드뉴스 아이디어 테이블
CREATE TABLE IF NOT EXISTS cardnews_ideas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  source TEXT,
  viral_score INTEGER DEFAULT 50,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 카드뉴스 생성 결과 테이블
CREATE TABLE IF NOT EXISTS cardnews_outputs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  idea_id BIGINT REFERENCES cardnews_ideas(id),
  card_number INTEGER,
  image_url TEXT,
  title_text TEXT,
  subtitle_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_cardnews_ideas_status ON cardnews_ideas(status);
CREATE INDEX IF NOT EXISTS idx_cardnews_outputs_idea ON cardnews_outputs(idea_id);

-- RLS
ALTER TABLE cardnews_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cardnews_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON cardnews_ideas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON cardnews_outputs FOR ALL USING (true) WITH CHECK (true);
