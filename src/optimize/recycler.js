import { getDb } from '../shared/db.js';

const RECYCLE_MAP = {
  blog_expert: ['card_news', 'short_video', 'blog_general'],
  blog_general: ['card_news', 'short_video'],
  card_news: ['blog_general', 'short_video'],
  short_video: ['blog_general', 'card_news'],
};

const SEASON_KEYWORDS = {
  '01': ['겨울', '난방', '보온', '동절기'],
  '02': ['겨울', '설날', '명절'],
  '03': ['봄', '환절기', '알레르기', '꽃가루'],
  '04': ['봄', '산책', '환절기'],
  '05': ['초여름', '산책', '야외'],
  '06': ['여름', '더위', '냉방', '수분'],
  '07': ['여름', '장마', '습도', '피부'],
  '08': ['여름', '더위', '열사병'],
  '09': ['가을', '환절기', '털갈이'],
  '10': ['가을', '산책', '단풍'],
  '11': ['초겨울', '환절기', '난방'],
  '12': ['겨울', '크리스마스', '연말'],
};

export function findHighPerformers(topPercent = 10) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.*, COALESCE(SUM(p.views), 0) as total_views,
           COALESCE(SUM(p.clicks), 0) as total_clicks,
           COALESCE(SUM(p.conversions), 0) as total_conversions
    FROM contents c LEFT JOIN performance p ON c.id = p.content_id
    WHERE c.status = 'published'
    GROUP BY c.id
    ORDER BY total_views DESC
  `).all();
  if (!rows.length) return [];
  const cutoff = Math.max(1, Math.ceil(rows.length * topPercent / 100));
  return rows.slice(0, cutoff);
}

export function suggestRecycle(contentId) {
  const db = getDb();
  const content = db.prepare('SELECT * FROM contents WHERE id = ?').get(contentId);
  if (!content) return { error: 'Content not found' };

  const targets = RECYCLE_MAP[content.type] || ['blog_general'];
  const existing = db.prepare(`
    SELECT type FROM contents WHERE title LIKE ? AND id != ?
  `).all(`%${(content.title || '').slice(0, 20)}%`, contentId).map(r => r.type);

  const suggestions = targets
    .filter(t => !existing.includes(t))
    .map(t => ({ targetType: t, reason: `${content.type} → ${t} 변환` }));

  const daysSincePublish = content.published_at
    ? Math.floor((Date.now() - new Date(content.published_at).getTime()) / 86400000)
    : null;

  if (daysSincePublish && daysSincePublish >= 30) {
    suggestions.push({ targetType: 'update', reason: `발행 ${daysSincePublish}일 경과 — 업데이트 재발행 추천` });
  }

  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const seasonKeys = SEASON_KEYWORDS[currentMonth] || [];
  if (seasonKeys.length) {
    suggestions.push({ targetType: 'seasonal', reason: `계절 키워드 교체: ${seasonKeys.join(', ')}` });
  }

  return { contentId, originalType: content.type, title: content.title, suggestions };
}

export function createRecycledContent(contentId, targetType) {
  const db = getDb();
  const original = db.prepare('SELECT * FROM contents WHERE id = ?').get(contentId);
  if (!original) return { error: 'Content not found' };

  const newTitle = targetType === 'update'
    ? `[업데이트] ${original.title}`
    : `[${targetType}] ${original.title}`;

  const body = generateDraft(original, targetType);

  const result = db.prepare(`
    INSERT INTO contents (topic_id, type, title, body, tags, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'draft', datetime('now'))
  `).run(
    original.topic_id,
    targetType === 'update' || targetType === 'seasonal' ? original.type : targetType,
    newTitle,
    body,
    original.tags,
  );

  return { id: result.lastInsertRowid, title: newTitle, type: targetType, status: 'draft', originalId: contentId };
}

function generateDraft(original, targetType) {
  const body = original.body || '';
  switch (targetType) {
    case 'card_news':
      return `[카드뉴스 초안]\n\n슬라이드 1: ${original.title}\n\n슬라이드 2: ${body.slice(0, 200)}\n\n슬라이드 3: 핵심 포인트\n\n슬라이드 4: CTA`;
    case 'short_video':
      return `[숏폼 스크립트 초안]\n\n훅: ${original.title}\n\n본문 (15초): ${body.slice(0, 150)}\n\nCTA (5초): 더 알아보기`;
    case 'blog_general':
      return `[일반 블로그 초안]\n\n${original.title}\n\n${body.slice(0, 500)}\n\n(원본 기반 재작성 필요)`;
    case 'update':
      return `[업데이트 버전]\n\n${body}\n\n---\n[업데이트 섹션 추가 필요]`;
    case 'seasonal': {
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const keys = SEASON_KEYWORDS[month] || [];
      return `[계절 키워드 교체 버전]\n추천 키워드: ${keys.join(', ')}\n\n${body}`;
    }
    default:
      return `[${targetType} 초안]\n\n${body.slice(0, 500)}`;
  }
}

export function suggestUpdates(daysThreshold = 30) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.*, COALESCE(SUM(p.views), 0) as total_views
    FROM contents c LEFT JOIN performance p ON c.id = p.content_id
    WHERE c.status = 'published'
      AND c.published_at IS NOT NULL
      AND julianday('now') - julianday(c.published_at) >= ?
    GROUP BY c.id
    ORDER BY total_views DESC
  `).all(daysThreshold);
  return rows;
}
