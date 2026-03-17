/**
 * 오전 전문가 블로그 포스트 — cron: 매일 09:00
 * TODO: OpenAI API 연동하여 실제 콘텐츠 생성 구현
 */
import { getDb, closeDb } from '../src/shared/db.js';

async function morningPost() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  const topic = db.prepare(`
    SELECT * FROM trending_topics 
    WHERE date = ? AND status = 'selected'
    ORDER BY score DESC LIMIT 1
  `).get(today);

  if (!topic) {
    console.log('[morning-post] 선정된 주제 없음 — 건너뜀');
    closeDb();
    return;
  }

  console.log(`[morning-post] 주제: ${topic.keyword} (스코어: ${topic.score})`);
  console.log('[morning-post] TODO: OpenAI API로 전문가 블로그 콘텐츠 생성');

  // TODO: OpenAI API 호출 → 콘텐츠 생성 → contents 테이블 INSERT
  // TODO: 네이버 블로그 자동 발행

  closeDb();
}

morningPost().catch(err => {
  console.error('[morning-post] 에러:', err.message);
  closeDb();
  process.exit(1);
});
