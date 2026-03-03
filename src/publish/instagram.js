/**
 * Instagram 발행 모듈 (스텁)
 * Meta Graph API 승인 대기 중 — 구조만 구현.
 */

import { getDb } from '../shared/db.js';

/**
 * Instagram에 카드뉴스를 발행한다.
 * @param {number} contentId - contents 테이블의 id
 * @param {object} options - { dryRun: boolean }
 * @returns {{ success: boolean, url?: string, error?: string }}
 */
export async function publishToInstagram(contentId, options = {}) {
  const { dryRun = false } = options;
  const db = getDb();

  // 콘텐츠 조회
  const content = db.prepare(
    `SELECT * FROM contents WHERE id = ? AND status = 'approved' AND type = 'card_news'`
  ).get(contentId);

  if (!content) {
    return { success: false, error: `콘텐츠 ${contentId} 없음 또는 card_news 아님` };
  }

  // 이미지 경로 파싱
  let images = [];
  try {
    images = JSON.parse(content.images || '[]');
  } catch {
    // ignore
  }

  // 캡션 준비
  const caption = [
    content.title,
    '',
    content.body?.substring(0, 2000) || '',
    '',
    // 태그
    ...(JSON.parse(content.tags || '[]').map(t => `#${t}`)),
  ].join('\n');

  console.log(`📸 Instagram 발행 준비: [${content.id}] ${content.title}`);
  console.log(`  이미지: ${images.length}개`);
  console.log(`  캡션: ${caption.substring(0, 100)}...`);

  if (dryRun) {
    console.log('🏃 DRY-RUN 모드 — 실제 발행 건너뜀');
    return { success: true, url: `https://instagram.com/p/dry-run-${contentId}`, dryRun: true };
  }

  // TODO: Meta Graph API 연동
  // 1. 이미지를 공개 URL로 업로드 (또는 컨테이너 생성)
  // 2. POST /me/media { image_url, caption, access_token }
  // 3. POST /me/media_publish { creation_id, access_token }
  // 4. 발행 URL 추출

  console.warn('⚠️ Instagram API 미연동 — 스텁 반환');
  return { success: false, error: 'Instagram API 미연동 (TODO)' };
}

export default publishToInstagram;
