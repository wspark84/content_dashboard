/**
 * A/B 테스트 엔진
 * - 동일 주제 2개 콘텐츠 생성 (변수: 제목/CTA/발행시간)
 * - 양쪽 발행 → 3일간 성과 비교 → 승자 결정
 * - ab_tests 테이블에 결과 기록
 * - learned_rules에 패턴 추가
 */
import { getDb, closeDb } from '../shared/db.js';

const VALID_TYPES = ['title', 'intro', 'cta', 'time', 'length'];
const VALID_METRICS = ['views', 'clicks', 'cta_clicks', 'conversions'];
const MIN_SAMPLE = 50;
const SIGNIFICANCE_THRESHOLD = 0.2; // 20%
const TEST_DURATION_DAYS = 3;

/**
 * A/B 테스트 생성
 */
export function createTest(type, variantA, variantB) {
  if (!VALID_TYPES.includes(type)) {
    throw new Error(`Invalid test type: ${type}. Must be one of: ${VALID_TYPES.join(', ')}`);
  }
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO ab_tests (test_type, variant_a, variant_b, status)
    VALUES (?, ?, ?, 'running')
  `).run(type, variantA, variantB);
  console.log(`[ab-test] 테스트 #${result.lastInsertRowid} 생성: ${type} (A="${variantA}" vs B="${variantB}")`);
  return { id: result.lastInsertRowid, type, variantA, variantB, status: 'running' };
}

/**
 * 테스트에 콘텐츠 할당
 */
export function assignVariant(testId, contentId, variant) {
  if (!['A', 'B'].includes(variant)) {
    throw new Error('variant must be "A" or "B"');
  }
  const db = getDb();
  const col = variant === 'A' ? 'content_a_id' : 'content_b_id';
  db.prepare(`UPDATE ab_tests SET ${col} = ? WHERE id = ?`).run(contentId, testId);
  return { testId, contentId, variant };
}

/**
 * 동일 주제로 2개 변형 콘텐츠 생성 (제목 변형)
 */
export function createTitleTest(topicId) {
  const db = getDb();
  const topic = db.prepare('SELECT * FROM trending_topics WHERE id = ?').get(topicId);
  if (!topic) throw new Error(`Topic #${topicId} not found`);

  const titleVariants = generateTitleVariants(topic.keyword);
  const test = createTest('title', titleVariants[0], titleVariants[1]);

  // 변형 A 콘텐츠
  const resA = db.prepare(`
    INSERT INTO contents (topic_id, type, title, body, tags, status, review_note)
    VALUES (?, 'blog_general', ?, ?, ?, 'draft', ?)
  `).run(topic.id, titleVariants[0], `[A/B 테스트 변형 A] ${topic.keyword} 관련 콘텐츠`, 
    JSON.stringify([topic.keyword]), `A/B 테스트 #${test.id} 변형 A`);
  assignVariant(test.id, resA.lastInsertRowid, 'A');

  // 변형 B 콘텐츠
  const resB = db.prepare(`
    INSERT INTO contents (topic_id, type, title, body, tags, status, review_note)
    VALUES (?, 'blog_general', ?, ?, ?, 'draft', ?)
  `).run(topic.id, titleVariants[1], `[A/B 테스트 변형 B] ${topic.keyword} 관련 콘텐츠`,
    JSON.stringify([topic.keyword]), `A/B 테스트 #${test.id} 변형 B`);
  assignVariant(test.id, resB.lastInsertRowid, 'B');

  console.log(`[ab-test] 제목 테스트 생성: A="${titleVariants[0]}" vs B="${titleVariants[1]}"`);
  return { test, contentA: resA.lastInsertRowid, contentB: resB.lastInsertRowid };
}

/**
 * CTA 위치 변형 테스트
 */
export function createCtaTest(topicId) {
  const db = getDb();
  const topic = db.prepare('SELECT * FROM trending_topics WHERE id = ?').get(topicId);
  if (!topic) throw new Error(`Topic #${topicId} not found`);

  const test = createTest('cta', 'top_cta', 'bottom_cta');

  const CTA = '🩺 멍냥닥터에게 직접 물어보세요 👉 https://open.kakao.com/o/gkkLxt9h';
  const body = `${topic.keyword} 관련 핵심 정보입니다.\n\n사료 선택 시 성분표를 꼼꼼히 확인하세요.`;

  const resA = db.prepare(`
    INSERT INTO contents (topic_id, type, title, body, tags, status, review_note)
    VALUES (?, 'blog_general', ?, ?, ?, 'draft', ?)
  `).run(topic.id, `${topic.keyword} 완벽 가이드`, `${CTA}\n\n${body}`,
    JSON.stringify([topic.keyword]), `A/B 테스트 #${test.id} CTA 상단`);
  assignVariant(test.id, resA.lastInsertRowid, 'A');

  const resB = db.prepare(`
    INSERT INTO contents (topic_id, type, title, body, tags, status, review_note)
    VALUES (?, 'blog_general', ?, ?, ?, 'draft', ?)
  `).run(topic.id, `${topic.keyword} 완벽 가이드`, `${body}\n\n${CTA}`,
    JSON.stringify([topic.keyword]), `A/B 테스트 #${test.id} CTA 하단`);
  assignVariant(test.id, resB.lastInsertRowid, 'B');

  return { test, contentA: resA.lastInsertRowid, contentB: resB.lastInsertRowid };
}

/**
 * 제목 변형 생성
 */
function generateTitleVariants(keyword) {
  return [
    `${keyword}, 전문가가 알려드리는 핵심 포인트`,  // 정보형
    `${keyword}? 이것만 알면 걱정 끝!`,              // 물음표형
  ];
}

/**
 * 테스트 평가 — 3일 경과 후 성과 비교
 */
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

  // 3일 경과 체크
  const startDate = new Date(test.started_at);
  const now = new Date();
  const daysPassed = (now - startDate) / (1000 * 60 * 60 * 24);
  if (daysPassed < TEST_DURATION_DAYS) {
    return { testId, status: 'waiting', daysPassed: daysPassed.toFixed(1), daysRemaining: (TEST_DURATION_DAYS - daysPassed).toFixed(1) };
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

  if (a.total_views < MIN_SAMPLE && b.total_views < MIN_SAMPLE) {
    return {
      testId, status: 'insufficient_data',
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

    // learned_rules에 패턴 추가
    const winnerVariant = winner === 'A' ? test.variant_a : test.variant_b;
    saveLearnedRule(db, test.test_type, winnerVariant, diff, testId);
  } else {
    db.prepare(`UPDATE ab_tests SET metric = ?, status = 'no_difference', ended_at = datetime('now') WHERE id = ?`)
      .run(metric, testId);
  }

  return {
    testId, status: winner ? 'completed' : 'no_significant_difference',
    metric,
    a: { contentId: test.content_a_id, value: aVal },
    b: { contentId: test.content_b_id, value: bVal },
    difference: `${(diff * 100).toFixed(1)}%`,
    winner,
  };
}

/**
 * A/B 테스트 결과를 learned_rules에 저장
 */
function saveLearnedRule(db, testType, winnerVariant, difference, testId) {
  const categoryMap = {
    title: 'title_style',
    intro: 'intro_style',
    cta: 'cta_position',
    time: 'publish_time',
    length: 'content_length',
  };
  const category = categoryMap[testType] || testType;
  const rule = `A/B 테스트 #${testId}: "${winnerVariant}" 변형이 ${(difference * 100).toFixed(1)}% 더 높은 성과`;

  db.prepare(`
    INSERT INTO learned_rules (category, rule, confidence, sample_size, updated_at)
    VALUES (?, ?, ?, 1, datetime('now'))
  `).run(category, rule, Math.min(0.95, 0.5 + difference));

  console.log(`[ab-test] 학습 규칙 저장: ${category} — ${rule}`);
}

/**
 * 만료된 테스트 일괄 평가
 */
export function evaluateExpiredTests(metric = 'views') {
  const db = getDb();
  const tests = db.prepare(`
    SELECT id FROM ab_tests 
    WHERE status = 'running' 
      AND julianday('now') - julianday(started_at) >= ?
  `).all(TEST_DURATION_DAYS);

  const results = [];
  for (const test of tests) {
    try {
      results.push(evaluateTest(test.id, metric));
    } catch (err) {
      console.error(`[ab-test] 테스트 #${test.id} 평가 실패:`, err.message);
    }
  }
  console.log(`[ab-test] ${results.length}개 만료 테스트 평가 완료`);
  return results;
}

/**
 * 테스트 목록 조회
 */
export function listTests(status) {
  const db = getDb();
  if (status) {
    return db.prepare('SELECT * FROM ab_tests WHERE status = ? ORDER BY started_at DESC').all(status);
  }
  return db.prepare('SELECT * FROM ab_tests ORDER BY started_at DESC').all();
}

// CLI
if (process.argv[1]?.includes('ab-test')) {
  try {
    console.log('=== A/B Test Engine ===');
    
    // 테스트 생성 데모
    const test = createTest('title', '정보형 제목', '물음표형 제목');
    console.log('Created test:', test);
    
    // 만료 테스트 평가
    const expired = evaluateExpiredTests();
    console.log('Expired tests evaluated:', expired.length);
    
    // 전체 테스트 목록
    const all = listTests();
    console.log('All tests:', all.length);
    
    console.log('✅ ab-test.js OK');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    closeDb();
  }
}
