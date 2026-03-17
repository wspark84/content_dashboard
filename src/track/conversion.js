/**
 * 전환 추적 — bit.ly 단축 URL + CTA 클릭 추적
 * bit.ly API 키 없으므로 스텁 + 로컬 카운터로 구현
 */
import { getDb } from '../shared/db.js';

// In-memory click counter (reset on restart; persistent via performance table)
const clickCounter = new Map();

/**
 * 단축 URL 생성 (스텁 — bit.ly API 키 확보 시 교체)
 */
export async function createShortUrl(longUrl, contentId) {
  const BITLY_TOKEN = process.env.BITLY_TOKEN;
  if (BITLY_TOKEN) {
    const res = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: { Authorization: `Bearer ${BITLY_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ long_url: longUrl }),
    });
    const data = await res.json();
    return data.link || longUrl;
  }
  // 스텁: 원본 URL 반환 + 로컬 추적 등록
  clickCounter.set(String(contentId), 0);
  console.log(`[conversion] 스텁 모드 — 단축 URL 미생성, 로컬 추적 등록: content_id=${contentId}`);
  return longUrl;
}

/**
 * bit.ly 클릭수 조회 (스텁)
 */
export async function getClickCount(shortUrl) {
  const BITLY_TOKEN = process.env.BITLY_TOKEN;
  if (BITLY_TOKEN && shortUrl.includes('bit.ly')) {
    const id = shortUrl.replace('https://', '').replace('http://', '');
    const res = await fetch(`https://api-ssl.bitly.com/v4/bitlinks/${id}/clicks/summary`, {
      headers: { Authorization: `Bearer ${BITLY_TOKEN}` },
    });
    const data = await res.json();
    return data.total_clicks || 0;
  }
  return 0;
}

/**
 * CTA 클릭 기록 (로컬 카운터 + DB)
 */
export function recordCtaClick(contentId) {
  const key = String(contentId);
  clickCounter.set(key, (clickCounter.get(key) || 0) + 1);

  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  db.prepare(`
    INSERT INTO performance (content_id, date, cta_clicks)
    VALUES (?, ?, 1)
    ON CONFLICT(content_id, date) DO UPDATE SET cta_clicks = cta_clicks + 1
  `).run(contentId, today);

  return clickCounter.get(key);
}

/**
 * 특정 콘텐츠의 CTA 클릭수 조회
 */
export function getCtaClicks(contentId) {
  const db = getDb();
  const row = db.prepare(`
    SELECT COALESCE(SUM(cta_clicks), 0) as total FROM performance WHERE content_id = ?
  `).get(contentId);
  return row?.total || 0;
}

/**
 * 전체 CTA 클릭 요약
 */
export function getCtaSummary() {
  const db = getDb();
  return db.prepare(`
    SELECT c.id, c.title, c.type, COALESCE(SUM(p.cta_clicks), 0) as total_cta
    FROM contents c
    LEFT JOIN performance p ON p.content_id = c.id
    WHERE c.status = 'published'
    GROUP BY c.id
    ORDER BY total_cta DESC
    LIMIT 20
  `).all();
}

// CLI test
if (process.argv[1]?.endsWith('conversion.js')) {
  console.log('=== Conversion Tracking Test ===');
  const url = await createShortUrl('https://pf.kakao.com/_example', 999);
  console.log('Short URL:', url);
  console.log('CTA summary:', getCtaSummary());
  console.log('✅ conversion.js OK');
}
