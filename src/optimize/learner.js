import { getDb } from '../shared/db.js';

function classifyTitleStyle(title) {
  if (!title) return 'unknown';
  if (title.includes('?') || title.includes('？')) return 'question';
  if (/[!！]{1,}|충격|경악|헐|대박|긴급/.test(title)) return 'shock';
  return 'informational';
}

function getHourBucket(dateStr) {
  if (!dateStr) return null;
  const h = new Date(dateStr).getHours();
  if (h < 9) return 'early_morning';
  if (h < 12) return 'morning';
  if (h < 15) return 'afternoon_early';
  if (h < 18) return 'afternoon_late';
  return 'evening';
}

function getLengthBucket(body) {
  if (!body) return 'unknown';
  const len = body.length;
  if (len < 1000) return 'short';
  if (len < 1800) return 'medium';
  if (len < 2500) return 'optimal';
  return 'long';
}

export function learnTitleStyles() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.title, COALESCE(SUM(p.views), 0) as total_views
    FROM contents c LEFT JOIN performance p ON c.id = p.content_id
    WHERE c.title IS NOT NULL
    GROUP BY c.id
  `).all();
  if (!rows.length) return [];

  const buckets = {};
  for (const r of rows) {
    const style = classifyTitleStyle(r.title);
    if (!buckets[style]) buckets[style] = { views: [], count: 0 };
    buckets[style].views.push(r.total_views);
    buckets[style].count++;
  }

  const results = [];
  const styles = Object.entries(buckets).map(([k, v]) => ({
    style: k, avg: v.views.reduce((a, b) => a + b, 0) / v.count, count: v.count,
  }));
  styles.sort((a, b) => b.avg - a.avg);

  if (styles.length >= 2) {
    const best = styles[0];
    const second = styles[1];
    const diff = second.avg > 0 ? ((best.avg - second.avg) / second.avg * 100).toFixed(0) : 'N/A';
    const styleName = { question: '물음표형', shock: '충격형', informational: '정보형' };
    results.push({
      category: 'title_style',
      rule: `${styleName[best.style] || best.style} 제목이 평균 ${diff}% 더 높은 조회수`,
      confidence: Math.min(0.95, 0.3 + best.count * 0.01),
      sample_size: best.count,
    });
  }
  return results;
}

export function learnCtaPosition() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.body, COALESCE(SUM(p.cta_clicks), 0) as cta, COALESCE(SUM(p.views), 0) as views
    FROM contents c LEFT JOIN performance p ON c.id = p.content_id
    WHERE c.body IS NOT NULL
    GROUP BY c.id
  `).all();
  if (!rows.length) return [];

  const buckets = { top: { ctr: [], count: 0 }, middle: { ctr: [], count: 0 }, bottom: { ctr: [], count: 0 } };
  for (const r of rows) {
    const body = r.body || '';
    const ctaIdx = body.search(/CTA|구매|바로가기|클릭|확인하기/);
    let pos = 'bottom';
    if (ctaIdx >= 0) {
      const ratio = ctaIdx / Math.max(body.length, 1);
      if (ratio < 0.3) pos = 'top';
      else if (ratio < 0.7) pos = 'middle';
    }
    const ctr = r.views > 0 ? r.cta / r.views : 0;
    buckets[pos].ctr.push(ctr);
    buckets[pos].count++;
  }

  const results = Object.entries(buckets)
    .filter(([, v]) => v.count > 0)
    .map(([k, v]) => ({ position: k, avgCtr: v.ctr.reduce((a, b) => a + b, 0) / v.count, count: v.count }))
    .sort((a, b) => b.avgCtr - a.avgCtr);

  if (results.length) {
    const posName = { top: '상단', middle: '중간', bottom: '하단' };
    return [{
      category: 'cta_position',
      rule: `${posName[results[0].position]} CTA가 가장 높은 클릭률 (${(results[0].avgCtr * 100).toFixed(1)}%)`,
      confidence: Math.min(0.95, 0.3 + results[0].count * 0.01),
      sample_size: results[0].count,
    }];
  }
  return [];
}

export function learnPublishTime() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.published_at, COALESCE(SUM(p.views), 0) as views
    FROM contents c LEFT JOIN performance p ON c.id = p.content_id
    WHERE c.published_at IS NOT NULL
    GROUP BY c.id
  `).all();
  if (!rows.length) return [];

  const buckets = {};
  for (const r of rows) {
    const bucket = getHourBucket(r.published_at);
    if (!bucket) continue;
    if (!buckets[bucket]) buckets[bucket] = { views: [], count: 0 };
    buckets[bucket].views.push(r.views);
    buckets[bucket].count++;
  }

  const results = Object.entries(buckets)
    .map(([k, v]) => ({ time: k, avg: v.views.reduce((a, b) => a + b, 0) / v.count, count: v.count }))
    .sort((a, b) => b.avg - a.avg);

  if (results.length) {
    const timeName = { early_morning: '이른 아침', morning: '오전', afternoon_early: '오후 초반', afternoon_late: '오후 후반', evening: '저녁' };
    return [{
      category: 'publish_time',
      rule: `${timeName[results[0].time]} 발행이 평균 조회수 최고 (${results[0].avg.toFixed(0)}회)`,
      confidence: Math.min(0.95, 0.3 + results[0].count * 0.01),
      sample_size: results[0].count,
    }];
  }
  return [];
}

export function learnContentLength() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.body, COALESCE(SUM(p.views), 0) as views
    FROM contents c LEFT JOIN performance p ON c.id = p.content_id
    WHERE c.body IS NOT NULL
    GROUP BY c.id
  `).all();
  if (!rows.length) return [];

  const buckets = {};
  for (const r of rows) {
    const bucket = getLengthBucket(r.body);
    if (!buckets[bucket]) buckets[bucket] = { views: [], count: 0 };
    buckets[bucket].views.push(r.views);
    buckets[bucket].count++;
  }

  const results = Object.entries(buckets)
    .map(([k, v]) => ({ length: k, avg: v.views.reduce((a, b) => a + b, 0) / v.count, count: v.count }))
    .sort((a, b) => b.avg - a.avg);

  if (results.length) {
    const lenName = { short: '1000자 미만', medium: '1000-1800자', optimal: '1800-2500자', long: '2500자 이상' };
    return [{
      category: 'content_length',
      rule: `${lenName[results[0].length]} 길이가 조회수 최적 (평균 ${results[0].avg.toFixed(0)}회)`,
      confidence: Math.min(0.95, 0.3 + results[0].count * 0.01),
      sample_size: results[0].count,
    }];
  }
  return [];
}

export function learnKeywordClusters() {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.tags, COALESCE(SUM(p.conversions), 0) as conv, COALESCE(SUM(p.views), 0) as views
    FROM contents c LEFT JOIN performance p ON c.id = p.content_id
    WHERE c.tags IS NOT NULL
    GROUP BY c.id
  `).all();
  if (!rows.length) return [];

  const clusters = {};
  for (const r of rows) {
    let tags;
    try { tags = JSON.parse(r.tags); } catch { continue; }
    if (!Array.isArray(tags)) continue;
    const cvr = r.views > 0 ? r.conv / r.views : 0;
    for (const tag of tags) {
      if (!clusters[tag]) clusters[tag] = { cvr: [], count: 0 };
      clusters[tag].cvr.push(cvr);
      clusters[tag].count++;
    }
  }

  const results = Object.entries(clusters)
    .filter(([, v]) => v.count >= 3)
    .map(([k, v]) => ({ keyword: k, avgCvr: v.cvr.reduce((a, b) => a + b, 0) / v.count, count: v.count }))
    .sort((a, b) => b.avgCvr - a.avgCvr)
    .slice(0, 5);

  if (results.length) {
    return [{
      category: 'keyword_cluster',
      rule: `"${results[0].keyword}" 키워드 클러스터 전환율 최고 (${(results[0].avgCvr * 100).toFixed(1)}%)`,
      confidence: Math.min(0.95, 0.3 + results[0].count * 0.01),
      sample_size: results[0].count,
    }];
  }
  return [];
}

export function learnAll() {
  const rules = [
    ...learnTitleStyles(),
    ...learnCtaPosition(),
    ...learnPublishTime(),
    ...learnContentLength(),
    ...learnKeywordClusters(),
  ];
  if (!rules.length) return [];

  const db = getDb();
  const upsert = db.prepare(`
    INSERT INTO learned_rules (category, rule, confidence, sample_size, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `);
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM learned_rules').run();
    for (const r of rules) {
      upsert.run(r.category, r.rule, r.confidence, r.sample_size);
    }
  });
  tx();
  return rules;
}

export function getRules() {
  const db = getDb();
  return db.prepare('SELECT * FROM learned_rules ORDER BY confidence DESC').all();
}
