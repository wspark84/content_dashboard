import Database from 'better-sqlite3';
import { resolve } from 'path';
import { config } from './config.js';

const DB_PATH = resolve(config.dataDir, 'mungnyang.db');

let _db;

export function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    initTables(_db);
  }
  return _db;
}

function initTables(db) {
  db.exec(`
    -- 크롤링된 원본 게시글
    CREATE TABLE IF NOT EXISTS raw_posts (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,           -- gangsamo, godahang, reddit, pubmed, dc, naver_news
      board TEXT,
      title TEXT NOT NULL,
      body TEXT,
      url TEXT,
      author TEXT,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      published_at TEXT,
      crawled_at TEXT DEFAULT (datetime('now')),
      keywords TEXT,                  -- JSON array
      sentiment TEXT,
      UNIQUE(source, url)
    );

    -- 추출된 트렌딩 주제
    CREATE TABLE IF NOT EXISTS trending_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      keyword TEXT NOT NULL,
      cluster TEXT,                   -- 키워드 클러스터
      score REAL DEFAULT 0,
      community_heat REAL DEFAULT 0,
      search_volume INTEGER DEFAULT 0,
      global_trend REAL DEFAULT 0,
      feed_match_count INTEGER DEFAULT 0,
      timeliness REAL DEFAULT 0,
      competition_gap REAL DEFAULT 0,
      sources TEXT,                   -- JSON: 어떤 소스에서 왔는지
      sample_questions TEXT,          -- JSON: 실제 질문들
      status TEXT DEFAULT 'pending',  -- pending, selected, published, skipped
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(date, keyword)
    );

    -- 생성된 콘텐츠
    CREATE TABLE IF NOT EXISTS contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER REFERENCES trending_topics(id),
      type TEXT NOT NULL,             -- blog_expert, blog_general, card_news, short_video
      title TEXT,
      body TEXT,
      html TEXT,
      images TEXT,                    -- JSON array of image paths
      tags TEXT,                      -- JSON array
      feed_products TEXT,             -- JSON: 매칭된 사료
      status TEXT DEFAULT 'draft',    -- draft, review, approved, published, failed
      reviewer TEXT,
      review_note TEXT,
      published_url TEXT,
      published_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 성과 추적
    CREATE TABLE IF NOT EXISTS performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content_id INTEGER REFERENCES contents(id),
      date TEXT NOT NULL,
      views INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      cta_clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      revenue REAL DEFAULT 0,
      keywords TEXT,                  -- JSON: 유입 키워드
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(content_id, date)
    );

    -- A/B 테스트
    CREATE TABLE IF NOT EXISTS ab_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_type TEXT NOT NULL,        -- title, intro, cta, time, length
      variant_a TEXT,
      variant_b TEXT,
      content_a_id INTEGER,
      content_b_id INTEGER,
      winner TEXT,
      metric TEXT,
      started_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT,
      status TEXT DEFAULT 'running'
    );

    -- 팀 활동 로그
    CREATE TABLE IF NOT EXISTS team_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_role TEXT,                 -- ceo, content_manager, marketer, designer
      action TEXT,                    -- approve, reject, edit, comment
      content_id INTEGER,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- 학습된 규칙
    CREATE TABLE IF NOT EXISTS learned_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,                  -- title_style, cta_position, publish_time, content_length
      rule TEXT,
      confidence REAL,
      sample_size INTEGER,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_raw_posts_source ON raw_posts(source, crawled_at);
    CREATE INDEX IF NOT EXISTS idx_trending_date ON trending_topics(date, score DESC);
    CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status, type);
    CREATE INDEX IF NOT EXISTS idx_performance_date ON performance(date);
  `);
}

export function closeDb() {
  if (_db) {
    _db.close();
    _db = null;
  }
}
