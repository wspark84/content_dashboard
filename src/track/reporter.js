/**
 * 일일/주간 리포트 생성 — 텔레그램 발송용 마크다운
 */
import { getDb } from '../shared/db.js';

/**
 * 일일 리포트 생성
 */
export function generateDailyReport(date) {
  const db = getDb();
  if (!date) date = new Date().toISOString().slice(0, 10);

  // 오늘 발행 건수
  const publishedToday = db.prepare(`
    SELECT COUNT(*) as cnt FROM contents
    WHERE status = 'published' AND DATE(published_at) = ?
  `).get(date);

  // 오늘 성과 요약
  const perf = db.prepare(`
    SELECT 
      COALESCE(SUM(views), 0) as total_views,
      COALESCE(SUM(clicks), 0) as total_clicks,
      COALESCE(SUM(conversions), 0) as total_conversions,
      COALESCE(SUM(revenue), 0) as total_revenue
    FROM performance WHERE date = ?
  `).get(date);

  // 트렌딩 주제 TOP 3
  const trending = db.prepare(`
    SELECT keyword, score FROM trending_topics
    WHERE date = ? ORDER BY score DESC LIMIT 3
  `).all(date);

  // 상위 콘텐츠 TOP 3
  const topContents = db.prepare(`
    SELECT c.title, p.views FROM performance p
    JOIN contents c ON c.id = p.content_id
    WHERE p.date = ? ORDER BY p.views DESC LIMIT 3
  `).all(date);

  // 대기중 콘텐츠
  const pending = db.prepare(`
    SELECT COUNT(*) as cnt FROM contents WHERE status IN ('draft', 'review')
  `).get();

  const trendingList = trending.length > 0
    ? trending.map((t, i) => `  ${i + 1}. ${t.keyword} (${t.score.toFixed(1)}점)`).join('\n')
    : '  데이터 없음';

  const topList = topContents.length > 0
    ? topContents.map((c, i) => `  ${i + 1}. ${c.title} — ${c.views.toLocaleString()}회`).join('\n')
    : '  데이터 없음';

  return `📊 멍냥바이럴 일일 리포트 (${date})
━━━━━━━━━━━━━
📝 오늘 발행: ${publishedToday.cnt}건
👀 총 조회수: ${(perf.total_views || 0).toLocaleString()}회
🖱️ 클릭: ${(perf.total_clicks || 0).toLocaleString()} | 전환: ${perf.total_conversions || 0}건
💰 매출: ${(perf.total_revenue || 0).toLocaleString()}원

🔥 트렌딩 주제:
${trendingList}

📈 상위 콘텐츠:
${topList}

📋 대기중: ${pending.cnt}건 (초안/검수)`;
}

/**
 * 주간 리포트 생성
 */
export function generateWeeklyReport(endDate) {
  const db = getDb();
  if (!endDate) endDate = new Date().toISOString().slice(0, 10);
  
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);
  const start = startDate.toISOString().slice(0, 10);

  const weekPerf = db.prepare(`
    SELECT 
      COUNT(DISTINCT content_id) as content_count,
      COALESCE(SUM(views), 0) as total_views,
      COALESCE(SUM(clicks), 0) as total_clicks,
      COALESCE(SUM(conversions), 0) as total_conversions,
      COALESCE(SUM(revenue), 0) as total_revenue
    FROM performance WHERE date BETWEEN ? AND ?
  `).get(start, endDate);

  const published = db.prepare(`
    SELECT COUNT(*) as cnt FROM contents
    WHERE status = 'published' AND DATE(published_at) BETWEEN ? AND ?
  `).get(start, endDate);

  const topKeywords = db.prepare(`
    SELECT keyword, MAX(score) as score FROM trending_topics
    WHERE date BETWEEN ? AND ? GROUP BY keyword ORDER BY score DESC LIMIT 5
  `).all(start, endDate);

  const kwList = topKeywords.length > 0
    ? topKeywords.map((k, i) => `  ${i + 1}. ${k.keyword}`).join('\n')
    : '  데이터 없음';

  const avgViews = weekPerf.content_count > 0
    ? Math.round(weekPerf.total_views / weekPerf.content_count)
    : 0;

  return `📊 멍냥바이럴 주간 리포트 (${start} ~ ${endDate})
━━━━━━━━━━━━━━━━━━
📝 발행: ${published.cnt}건
👀 총 조회수: ${weekPerf.total_views.toLocaleString()}회 (평균 ${avgViews.toLocaleString()}회/건)
🖱️ 클릭: ${weekPerf.total_clicks.toLocaleString()} | 전환: ${weekPerf.total_conversions}건
💰 주간 매출: ${weekPerf.total_revenue.toLocaleString()}원

🔑 주간 핫 키워드:
${kwList}

📊 콘텐츠 현황:
  추적 콘텐츠: ${weekPerf.content_count}건`;
}

// CLI
if (process.argv[1] && process.argv[1].endsWith('reporter.js')) {
  const type = process.argv[2] || 'daily';
  const report = type === 'weekly' ? generateWeeklyReport() : generateDailyReport();
  console.log(report);
}
