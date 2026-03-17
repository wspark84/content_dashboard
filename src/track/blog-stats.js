/**
 * 블로그 통계 수집 — 발행된 콘텐츠의 조회수를 수집하여 performance 테이블에 저장
 */
import { getDb } from '../shared/db.js';
import * as cheerio from 'cheerio';

/**
 * 네이버 블로그 글 조회수 파싱 (모바일 페이지)
 */
async function fetchViewCount(url) {
  try {
    // 모바일 URL로 변환 (조회수 파싱이 더 쉬움)
    const mobileUrl = url.replace('blog.naver.com', 'm.blog.naver.com');
    const res = await fetch(mobileUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    // 조회수 파싱 시도 (여러 셀렉터)
    let views = 0;
    const viewText = $('.blog_post_view_count, .post_view_count, .view_count, [class*="view"]').text();
    const match = viewText.match(/([\d,]+)/);
    if (match) views = parseInt(match[1].replace(/,/g, ''), 10);
    return views;
  } catch (err) {
    console.error(`조회수 수집 실패: ${url}`, err.message);
    return 0;
  }
}

/**
 * 발행된 모든 콘텐츠의 조회수를 수집하고 performance 테이블에 저장
 */
export async function collectBlogStats() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  const published = db.prepare(`
    SELECT id, published_url, title FROM contents 
    WHERE status = 'published' AND published_url IS NOT NULL
  `).all();

  console.log(`📊 발행된 콘텐츠 ${published.length}건 조회수 수집 시작`);

  const upsert = db.prepare(`
    INSERT INTO performance (content_id, date, views)
    VALUES (?, ?, ?)
    ON CONFLICT(content_id, date) DO UPDATE SET views = excluded.views
  `);

  let collected = 0;
  for (const item of published) {
    const views = await fetchViewCount(item.published_url);
    upsert.run(item.id, today, views);
    collected++;
    if (views > 0) {
      console.log(`  ✅ [${item.title}] ${views}회`);
    }
    // rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`📊 조회수 수집 완료: ${collected}건`);
  return collected;
}

/**
 * 특정 콘텐츠의 성과 데이터 조회
 */
export function getContentPerformance(contentId) {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM performance WHERE content_id = ? ORDER BY date DESC
  `).all(contentId);
}

/**
 * 날짜별 전체 성과 요약
 */
export function getDailyPerformanceSummary(date) {
  const db = getDb();
  return db.prepare(`
    SELECT 
      date,
      COUNT(*) as content_count,
      SUM(views) as total_views,
      SUM(clicks) as total_clicks,
      SUM(cta_clicks) as total_cta_clicks,
      SUM(conversions) as total_conversions,
      SUM(revenue) as total_revenue
    FROM performance
    WHERE date = ?
    GROUP BY date
  `).get(date);
}

// CLI 실행
if (process.argv[1] && process.argv[1].endsWith('blog-stats.js')) {
  collectBlogStats().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
