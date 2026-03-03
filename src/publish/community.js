/**
 * 커뮤니티 답글 모듈 (스텁)
 * 강사모/고다행 카페에 발행된 블로그 글 링크를 답글로 남기는 기능.
 */

import { getDb } from '../shared/db.js';

/**
 * 커뮤니티에 블로그 글 링크 답글을 남긴다.
 * @param {number} contentId - contents 테이블의 id (published 상태)
 * @param {object} options - { dryRun, community: 'gangsamo' | 'godahang' }
 * @returns {{ success: boolean, error?: string }}
 */
export async function postToCommunity(contentId, options = {}) {
  const { dryRun = false, community = 'gangsamo' } = options;
  const db = getDb();

  const content = db.prepare(
    `SELECT * FROM contents WHERE id = ? AND status = 'published' AND published_url IS NOT NULL`
  ).get(contentId);

  if (!content) {
    return { success: false, error: `콘텐츠 ${contentId}: published 상태 아니거나 URL 없음` };
  }

  console.log(`💬 커뮤니티 답글 준비: [${community}] ${content.title}`);
  console.log(`  블로그 URL: ${content.published_url}`);

  if (dryRun) {
    console.log('🏃 DRY-RUN 모드 — 실제 답글 건너뜀');
    return { success: true, dryRun: true };
  }

  // TODO: 카페 로그인 + 관련 게시글 찾기 + 답글 작성
  // 1. Puppeteer로 네이버 카페 로그인
  // 2. 관련 토픽의 원본 게시글 찾기 (topic_id → raw_posts)
  // 3. 답글에 블로그 URL + 요약 코멘트 작성
  // 4. 스팸 방지: 하루 최대 3건, 랜덤 딜레이

  console.warn('⚠️ 커뮤니티 답글 미구현 — 스텁 반환');
  return { success: false, error: '커뮤니티 답글 미구현 (TODO)' };
}

export default postToCommunity;
