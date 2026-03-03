/**
 * 오후 일반 블로그 포스트 — cron: 매일 15:00
 * TODO: OpenAI API 연동하여 실제 콘텐츠 생성 구현
 */
import { getDb, closeDb } from '../src/shared/db.js';

async function afternoonPost() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  const topic = db.prepare(`
    SELECT * FROM trending_topics 
    WHERE date = ? AND status = 'selected'
    ORDER BY score ASC LIMIT 1
  `).get(today);

  if (!topic) {
    console.log('[afternoon-post] 선정된 주제 없음 — 건너뜀');
    closeDb();
    return;
  }

  console.log(`[afternoon-post] 주제: ${topic.keyword} (스코어: ${topic.score})`);
  console.log('[afternoon-post] TODO: OpenAI API로 일반 블로그 콘텐츠 생성');

  closeDb();
}

afternoonPost().catch(err => {
  console.error('[afternoon-post] 에러:', err.message);
  closeDb();
  process.exit(1);
});
