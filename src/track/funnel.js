/**
 * 퍼널 분석 — 노출 → 클릭 → 관심 → 상담 → 구매
 * performance 테이블 데이터 기반
 */
import { getDb } from '../shared/db.js';

/**
 * 퍼널 계산
 * @param {{ start?: string, end?: string, days?: number }} dateRange
 */
export function calculateFunnel(dateRange = {}) {
  const db = getDb();

  let whereClause, params;
  if (dateRange.start && dateRange.end) {
    whereClause = 'WHERE date BETWEEN ? AND ?';
    params = [dateRange.start, dateRange.end];
  } else {
    const days = dateRange.days || 30;
    whereClause = `WHERE date >= date('now', ?)`;
    params = [`-${days} days`];
  }

  const row = db.prepare(`
    SELECT
      COALESCE(SUM(views), 0) as impressions,
      COALESCE(SUM(clicks), 0) as clicks,
      COALESCE(SUM(cta_clicks), 0) as interest,
      COALESCE(SUM(conversions), 0) as consultations,
      0 as purchases
    FROM performance ${whereClause}
  `).get(...params);

  // purchases: revenue > 0인 건수
  const purchaseRow = db.prepare(`
    SELECT COUNT(*) as cnt FROM performance ${whereClause} AND revenue > 0
  `).get(...params);
  row.purchases = purchaseRow?.cnt || 0;

  const safe = (a, b) => b > 0 ? +(a / b * 100).toFixed(2) : 0;

  return {
    impressions: row.impressions,
    clicks: row.clicks,
    interest: row.interest,
    consultations: row.consultations,
    purchases: row.purchases,
    conversionRates: {
      clickRate: safe(row.clicks, row.impressions),
      interestRate: safe(row.interest, row.clicks),
      consultRate: safe(row.consultations, row.interest),
      purchaseRate: safe(row.purchases, row.consultations),
      overall: safe(row.purchases, row.impressions),
    },
  };
}

/**
 * 일별 퍼널 추이
 */
export function dailyFunnel(days = 14) {
  const db = getDb();
  return db.prepare(`
    SELECT date,
      COALESCE(SUM(views), 0) as impressions,
      COALESCE(SUM(clicks), 0) as clicks,
      COALESCE(SUM(cta_clicks), 0) as interest,
      COALESCE(SUM(conversions), 0) as consultations
    FROM performance
    WHERE date >= date('now', ?)
    GROUP BY date ORDER BY date
  `).all(`-${days} days`);
}

// CLI test
if (process.argv[1]?.endsWith('funnel.js')) {
  console.log('=== Funnel Analysis Test ===');
  const result = calculateFunnel({ days: 30 });
  console.log(JSON.stringify(result, null, 2));
  console.log('\nDaily funnel:', dailyFunnel(7));
  console.log('✅ funnel.js OK');
}
