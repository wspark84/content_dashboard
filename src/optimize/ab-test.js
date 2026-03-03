import { getDb } from '../shared/db.js';

const VALID_TYPES = ['title', 'intro', 'cta', 'time', 'length'];
const VALID_METRICS = ['views', 'clicks', 'cta_clicks', 'conversions'];
const MIN_SAMPLE = 50;
const SIGNIFICANCE_THRESHOLD = 0.2; // 20%

export function createTest(type, variantA, variantB) {
  if (!VALID_TYPES.includes(type)) {
    throw new Error(`Invalid test type: ${type}. Must be one of: ${VALID_TYPES.join(', ')}`);
  }
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO ab_tests (test_type, variant_a, variant_b, status)
    VALUES (?, ?, ?, 'running')
  `).run(type, variantA, variantB);
  return { id: result.lastInsertRowid, type, variantA, variantB, status: 'running' };
}

export function assignVariant(testId, contentId, variant) {
  if (!['A', 'B'].includes(variant)) {
    throw new Error('variant must be "A" or "B"');
  }
  const db = getDb();
  const col = variant === 'A' ? 'content_a_id' : 'content_b_id';
  db.prepare(`UPDATE ab_tests SET ${col} = ? WHERE id = ?`).run(contentId, testId);
  return { testId, contentId, variant };
}

export function evaluateTest(testId, metric = 'views') {
  if (!VALID_METRICS.includes(metric)) {
    throw new Error(`Invalid metric: ${metric}. Must be one of: ${VALID_METRICS.join(', ')}`);
  }
  const db = getDb();
  const test = db.prepare('SELECT * FROM ab_tests WHERE id = ?').get(testId);
  if (!test) return { error: 'Test not found' };
  if (!test.content_a_id || !test.content_b_id) {
    return { testId, status: 'incomplete', message: 'Both variants must be assigned' };
  }

  const getMetric = (contentId) => {
    const row = db.prepare(`
      SELECT COALESCE(SUM(${metric}), 0) as total, COALESCE(SUM(views), 0) as total_views
      FROM performance WHERE content_id = ?
    `).get(contentId);
    return row || { total: 0, total_views: 0 };
  };

  const a = getMetric(test.content_a_id);
  const b = getMetric(test.content_b_id);

  if (a.total_views < MIN_SAMPLE || b.total_views < MIN_SAMPLE) {
    return {
      testId,
      status: 'insufficient_data',
      a: { contentId: test.content_a_id, [metric]: a.total, views: a.total_views },
      b: { contentId: test.content_b_id, [metric]: b.total, views: b.total_views },
      minSample: MIN_SAMPLE,
    };
  }

  const aVal = metric === 'views' ? a.total : a.total > 0 ? a.total / a.total_views : 0;
  const bVal = metric === 'views' ? b.total : b.total > 0 ? b.total / b.total_views : 0;
  const max = Math.max(aVal, bVal);
  const min = Math.min(aVal, bVal);
  const diff = min > 0 ? (max - min) / min : max > 0 ? 1 : 0;

  let winner = null;
  if (diff >= SIGNIFICANCE_THRESHOLD) {
    winner = aVal >= bVal ? 'A' : 'B';
    db.prepare(`UPDATE ab_tests SET winner = ?, metric = ?, status = 'completed', ended_at = datetime('now') WHERE id = ?`)
      .run(winner, metric, testId);
  }

  return {
    testId,
    status: winner ? 'completed' : 'no_significant_difference',
    metric,
    a: { contentId: test.content_a_id, value: aVal },
    b: { contentId: test.content_b_id, value: bVal },
    difference: `${(diff * 100).toFixed(1)}%`,
    winner,
  };
}

export function listTests(status) {
  const db = getDb();
  if (status) {
    return db.prepare('SELECT * FROM ab_tests WHERE status = ? ORDER BY started_at DESC').all(status);
  }
  return db.prepare('SELECT * FROM ab_tests ORDER BY started_at DESC').all();
}
