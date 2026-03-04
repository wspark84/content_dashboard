/**
 * 학습 엔진
 * - performance + contents 테이블 조인
 * - 상위 20% 고성과 콘텐츠 공통 패턴 분석
 * - learned_rules 테이블에 규칙 저장 (JSON)
 * - 제목 패턴, 발행 시간, CTA 유형 등 분석
 * 
 * learner.js의 확장 래퍼 — 상위 20% 패턴 분석 + 종합 인사이트 추가
 */
import { getDb, closeDb } from '../shared/db.js';
import { learnAll, getRules } from './learner.js';

/**
 * 상위 20% 고성과 콘텐츠 분석
 */
export function analyzeTopPerformers() {
  const db = getDb();
  
  const allContents = db.prepare(`
    SELECT c.*, 
      COALESCE(SUM(p.views), 0) as total_views,
      COALESCE(SUM(p.clicks), 0) as total_clicks,
      COALESCE(SUM(p.cta_clicks), 0) as total_cta,
      COALESCE(SUM(p.conversions), 0) as total_conv
    FROM contents c
    LEFT JOIN performance p ON c.id = p.content_id
    WHERE c.status = 'published'
    GROUP BY c.id
    ORDER BY total_views DESC
  `).all();

  if (allContents.length < 5) {
    console.log('[learning] 분석에 충분한 데이터 없음 (최소 5개 필요)');
    return { topPerformers: [], patterns: {}, rules: [] };
  }

  const cutoff = Math.max(1, Math.ceil(allContents.length * 0.2));
  const top = allContents.slice(0, cutoff);
  const rest = allContents.slice(cutoff);

  const patterns = {
    title: analyzeTitlePatterns(top, rest),
    timing: analyzeTimingPatterns(top, rest),
    length: analyzeLengthPatterns(top, rest),
    type: analyzeTypePatterns(top, rest),
    cta: analyzeCtaPatterns(top, rest),
  };

  console.log(`[learning] 상위 ${cutoff}/${allContents.length}개 분석 완료`);
  return { topPerformers: top.map(c => ({ id: c.id, title: c.title, views: c.total_views })), patterns };
}

function analyzeTitlePatterns(top, rest) {
  const classify = (title) => {
    if (!title) return 'unknown';
    if (title.includes('?') || title.includes('？')) return 'question';
    if (/[!！]|충격|대박|긴급/.test(title)) return 'shock';
    if (/꿀팁|방법|가이드|완벽/.test(title)) return 'howto';
    if (/추천|비교|순위|TOP/.test(title)) return 'listicle';
    return 'informational';
  };

  const topStyles = countBy(top.map(c => classify(c.title)));
  const restStyles = countBy(rest.map(c => classify(c.title)));
  
  return { topStyles, restStyles, insight: findDominant(topStyles) };
}

function analyzeTimingPatterns(top, rest) {
  const getHour = (d) => d ? new Date(d).getHours() : null;
  const bucket = (h) => {
    if (h === null) return 'unknown';
    if (h < 9) return 'early_morning';
    if (h < 12) return 'morning';
    if (h < 15) return 'afternoon';
    if (h < 18) return 'late_afternoon';
    return 'evening';
  };

  const topTimes = countBy(top.map(c => bucket(getHour(c.published_at))));
  const restTimes = countBy(rest.map(c => bucket(getHour(c.published_at))));
  
  return { topTimes, restTimes, insight: findDominant(topTimes) };
}

function analyzeLengthPatterns(top, rest) {
  const bucket = (body) => {
    if (!body) return 'unknown';
    const len = body.length;
    if (len < 1000) return 'short';
    if (len < 1800) return 'medium';
    if (len < 2500) return 'optimal';
    return 'long';
  };

  const topLen = countBy(top.map(c => bucket(c.body)));
  const restLen = countBy(rest.map(c => bucket(c.body)));
  
  return { topLen, restLen, insight: findDominant(topLen) };
}

function analyzeTypePatterns(top, rest) {
  const topTypes = countBy(top.map(c => c.type));
  const restTypes = countBy(rest.map(c => c.type));
  return { topTypes, restTypes, insight: findDominant(topTypes) };
}

function analyzeCtaPatterns(top, rest) {
  const detectCta = (body) => {
    if (!body) return 'none';
    const ctaIdx = body.search(/CTA|구매|바로가기|클릭|확인하기|카카오|물어보세요/);
    if (ctaIdx < 0) return 'none';
    const ratio = ctaIdx / Math.max(body.length, 1);
    if (ratio < 0.3) return 'top';
    if (ratio < 0.7) return 'middle';
    return 'bottom';
  };

  const topCta = countBy(top.map(c => detectCta(c.body)));
  const restCta = countBy(rest.map(c => detectCta(c.body)));
  return { topCta, restCta, insight: findDominant(topCta) };
}

function countBy(arr) {
  const counts = {};
  for (const item of arr) {
    counts[item] = (counts[item] || 0) + 1;
  }
  return counts;
}

function findDominant(counts) {
  const entries = Object.entries(counts).filter(([k]) => k !== 'unknown');
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return { dominant: entries[0][0], count: entries[0][1], total: entries.reduce((s, [, v]) => s + v, 0) };
}

/**
 * 종합 학습 실행 — learner.js + 상위 20% 분석
 */
export function runFullLearning() {
  console.log('[learning] === 종합 학습 시작 ===');
  
  // 1. 기존 learner.js의 세부 분석
  const basicRules = learnAll();
  console.log(`[learning] 기본 규칙 ${basicRules.length}건 학습`);

  // 2. 상위 20% 패턴 분석
  const { topPerformers, patterns } = analyzeTopPerformers();
  
  // 3. 패턴에서 추가 규칙 생성
  const db = getDb();
  const additionalRules = [];

  for (const [category, data] of Object.entries(patterns)) {
    if (data.insight && data.insight.dominant) {
      const pct = ((data.insight.count / data.insight.total) * 100).toFixed(0);
      const rule = `상위 20% 콘텐츠 중 ${pct}%가 "${data.insight.dominant}" 패턴`;
      const confidence = Math.min(0.95, data.insight.count / data.insight.total);
      
      db.prepare(`
        INSERT INTO learned_rules (category, rule, confidence, sample_size, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).run(`top20_${category}`, rule, confidence, data.insight.total);
      
      additionalRules.push({ category: `top20_${category}`, rule, confidence });
    }
  }

  const allRules = [...basicRules, ...additionalRules];
  console.log(`[learning] 총 ${allRules.length}건 규칙 저장 완료`);
  
  return {
    basicRules,
    additionalRules,
    topPerformers: topPerformers.slice(0, 5),
    patterns,
  };
}

/**
 * 현재 학습된 규칙 조회
 */
export { getRules };

// CLI
if (process.argv[1]?.includes('learning')) {
  try {
    const result = runFullLearning();
    console.log('\n=== 학습 결과 ===');
    console.log(`기본 규칙: ${result.basicRules.length}건`);
    console.log(`추가 규칙: ${result.additionalRules.length}건`);
    console.log(`상위 콘텐츠: ${result.topPerformers.length}건`);
    
    const rules = getRules();
    console.log(`\n현재 저장된 전체 규칙: ${rules.length}건`);
    for (const r of rules) {
      console.log(`  [${r.category}] ${r.rule} (신뢰도: ${(r.confidence * 100).toFixed(0)}%)`);
    }
    console.log('✅ learning.js OK');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    closeDb();
  }
}
