// 이미지 생성 (placeholder — API 연동 TODO)
import { getDb, closeDb } from '../shared/db.js';

/**
 * TODO: Imagen 또는 Flux API 연동
 * 실패 시 스킵, 플레이스홀더 절대 금지
 */
async function generateImage(prompt) {
  // TODO: 실제 API 호출 구현
  // const res = await fetch('https://api.example.com/generate', { ... });
  // if (!res.ok) return null; // 실패 시 null 반환 (스킵)
  // return savedPath;
  console.log(`[image-gen] TODO: 이미지 생성 미구현 — "${prompt.slice(0, 50)}..."`);
  return null;
}

/**
 * draft 콘텐츠에 대해 이미지 생성 시도
 */
export async function generateImagesForDrafts() {
  const db = getDb();
  const drafts = db.prepare(`
    SELECT c.id, c.title, t.keyword
    FROM contents c
    LEFT JOIN trending_topics t ON c.topic_id = t.id
    WHERE c.status IN ('draft', 'review') AND (c.images IS NULL OR c.images = '[]')
  `).all();

  const update = db.prepare(`UPDATE contents SET images = ? WHERE id = ?`);

  for (const draft of drafts) {
    const prompt = `반려동물 ${draft.keyword || draft.title} 관련 귀여운 일러스트`;
    const imagePath = await generateImage(prompt);
    if (imagePath) {
      update.run(JSON.stringify([imagePath]), draft.id);
      console.log(`[image-gen] #${draft.id}: 이미지 저장 완료`);
    } else {
      console.log(`[image-gen] #${draft.id}: 스킵 (생성 실패 또는 미구현)`);
    }
  }
}

// CLI
if (process.argv[1] && process.argv[1].includes('image-gen')) {
  generateImagesForDrafts().finally(() => closeDb());
}
