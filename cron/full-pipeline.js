/**
 * 전체 파이프라인 실행기 — 크롤링 → 분석 → 생성 → 품질 → 학습
 * 
 * Usage: node cron/full-pipeline.js [--dry-run]
 */
import { getDb, closeDb } from '../src/shared/db.js';
import { collectGangsamo } from '../src/collect/gangsamo.js';
import { collectGodahang } from '../src/collect/godahang.js';
import { collectDcGallery } from '../src/collect/dcgallery.js';
import { collectNaverNews } from '../src/collect/naver-news.js';
import { collectReddit } from '../src/collect/reddit.js';
import { selectTopics } from '../src/analyze/topic-selector.js';
import { createExpertPosts } from '../src/create/blog-expert.js';
import { createGeneralPosts } from '../src/create/blog-general.js';
import { reviewDrafts } from '../src/create/quality-check.js';
import { learnAll } from '../src/optimize/learner.js';

const DRY_RUN = process.argv.includes('--dry-run');

const collectors = [
  { name: 'gangsamo', fn: collectGangsamo },
  { name: 'godahang', fn: collectGodahang },
  { name: 'dcgallery', fn: collectDcGallery },
  { name: 'naver-news', fn: collectNaverNews },
  { name: 'reddit', fn: collectReddit },
];

async function runStep(name, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const ms = Date.now() - start;
    console.log(`✅ [${name}] 완료 (${ms}ms)`);
    return { status: 'ok', ms, result };
  } catch (err) {
    const ms = Date.now() - start;
    console.error(`❌ [${name}] 실패 (${ms}ms):`, err.message);
    return { status: 'error', ms, error: err.message };
  }
}

export async function runFullPipeline() {
  const results = {};
  const pipelineStart = Date.now();
  console.log(`\n🐾 ═══ 멍냥바이럴 전체 파이프라인 시작 ═══`);
  console.log(`   시간: ${new Date().toISOString()}`);
  console.log(`   모드: ${DRY_RUN ? 'DRY-RUN' : 'LIVE'}\n`);

  // 1. 크롤링
  console.log('── 1단계: 크롤링 ──');
  results.collect = {};
  for (const { name, fn } of collectors) {
    results.collect[name] = await runStep(`collect:${name}`, fn);
  }

  // 2. 분석 + 주제 선정
  console.log('\n── 2단계: 분석 + 주제 선정 ──');
  results.analyze = await runStep('analyze', selectTopics);

  // 3. 콘텐츠 생성
  console.log('\n── 3단계: 콘텐츠 생성 ──');
  results.expertPosts = await runStep('blog-expert', createExpertPosts);
  results.generalPosts = await runStep('blog-general', createGeneralPosts);

  // 4. 품질 검증
  console.log('\n── 4단계: 품질 검증 ──');
  results.quality = await runStep('quality-check', reviewDrafts);

  // 5. 학습 규칙 적용
  console.log('\n── 5단계: 학습 규칙 ──');
  results.learning = await runStep('learner', learnAll);

  // 요약
  const totalMs = Date.now() - pipelineStart;
  const steps = Object.values(results).flat();
  console.log(`\n🐾 ═══ 파이프라인 완료 (${(totalMs / 1000).toFixed(1)}s) ═══\n`);

  results._summary = { totalMs, dryRun: DRY_RUN, timestamp: new Date().toISOString() };
  return results;
}

// CLI 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullPipeline()
    .then(r => {
      console.log('\n📋 결과 요약:', JSON.stringify(r._summary, null, 2));
    })
    .catch(e => {
      console.error('파이프라인 치명적 오류:', e);
      process.exit(1);
    })
    .finally(() => closeDb());
}
