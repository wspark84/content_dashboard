/**
 * 주제 자동 선정 — 전체 파이프라인 엔트리포인트
 * 
 * 1. scorer.js → raw_posts 분석, trending_topics 생성
 * 2. 당일 trending_topics에서 스코어 상위 2개 선정
 * 3. 선정 결과 출력
 * 
 * Usage: node src/analyze/topic-selector.js
 */

import { getDb, closeDb } from '../shared/db.js';
import { runScoring } from './scorer.js';

async function selectTopics() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  console.log(`\n═══ 주제 선정 파이프라인 시작 [${today}] ═══\n`);

  // Step 1: 스코어링
  console.log('[1/3] 스코어링 엔진 실행...');
  const scored = await runScoring();

  if (scored.length === 0) {
    console.log('\n⚠️  분석할 데이터 없음 — 빈 결과 반환');
    const result = { date: today, selected: [], message: 'no data' };
    console.log('\n' + JSON.stringify(result, null, 2));
    closeDb();
    return result;
  }

  // Step 2: 상위 2개 선정
  console.log('\n[2/3] 주제 선정...');
  const topTopics = db.prepare(`
    SELECT * FROM trending_topics 
    WHERE date = ? AND status = 'pending'
    ORDER BY score DESC
    LIMIT 2
  `).all(today);

  if (topTopics.length === 0) {
    console.log('⚠️  선정 가능한 주제 없음');
    const result = { date: today, selected: [], message: 'no pending topics' };
    console.log('\n' + JSON.stringify(result, null, 2));
    closeDb();
    return result;
  }

  // status 업데이트
  const update = db.prepare(`UPDATE trending_topics SET status = 'selected' WHERE id = ?`);
  const types = ['expert', 'general'];

  const selected = topTopics.map((topic, i) => {
    update.run(topic.id);
    return {
      id: topic.id,
      type: types[i] || 'general',
      keyword: topic.keyword,
      cluster: topic.cluster,
      score: topic.score,
      components: {
        communityHeat: topic.community_heat,
        searchDemand: topic.search_volume,
        globalTrend: topic.global_trend,
        feedMatch: topic.feed_match_count,
        timeliness: topic.timeliness,
        competitionGap: topic.competition_gap,
      },
      sources: JSON.parse(topic.sources || '[]'),
      sampleQuestions: JSON.parse(topic.sample_questions || '[]'),
    };
  });

  // Step 3: 결과
  console.log('\n[3/3] 선정 완료!\n');
  const result = { date: today, selected };

  for (const s of selected) {
    console.log(`  📌 [${s.type}] ${s.keyword} (스코어: ${s.score})`);
    console.log(`     클러스터: ${s.cluster}`);
    console.log(`     소스: ${s.sources.join(', ')}`);
  }

  console.log('\n' + JSON.stringify(result, null, 2));
  closeDb();
  return result;
}

// 직접 실행 시
selectTopics().catch(err => {
  console.error('❌ 파이프라인 에러:', err.message);
  closeDb();
  process.exit(1);
});

export { selectTopics };
