/**
 * 승인 워크플로우 — draft → review → approved → published
 */
import { getDb } from '../shared/db.js';

const VALID_TRANSITIONS = {
  draft: ['review'],
  review: ['approved', 'draft'],  // 반려 시 draft로
  approved: ['published', 'review'],
  published: [],
};

/**
 * 콘텐츠 상태 변경
 */
export function changeStatus(contentId, newStatus, { role = 'system', note = '' } = {}) {
  const db = getDb();
  const content = db.prepare('SELECT id, status, title FROM contents WHERE id = ?').get(contentId);
  if (!content) throw new Error(`콘텐츠 #${contentId} 없음`);

  const allowed = VALID_TRANSITIONS[content.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`상태 전환 불가: ${content.status} → ${newStatus}`);
  }

  db.prepare('UPDATE contents SET status = ?, reviewer = ?, review_note = ? WHERE id = ?')
    .run(newStatus, role, note, contentId);

  logActivity(db, { role, action: `status:${newStatus}`, contentId, note });

  return { id: contentId, from: content.status, to: newStatus, title: content.title };
}

/**
 * 콘텐츠 승인
 */
export function approve(contentId, { role = 'ceo', note = '' } = {}) {
  const db = getDb();
  const content = db.prepare('SELECT status FROM contents WHERE id = ?').get(contentId);
  if (!content) throw new Error(`콘텐츠 #${contentId} 없음`);

  if (content.status === 'draft') {
    changeStatus(contentId, 'review', { role, note: '자동 검수 전환' });
  }
  return changeStatus(contentId, 'approved', { role, note });
}

/**
 * 콘텐츠 반려
 */
export function reject(contentId, { role = 'ceo', note = '반려' } = {}) {
  return changeStatus(contentId, 'draft', { role, note });
}

/**
 * 발행 완료 처리
 */
export function markPublished(contentId, publishedUrl, { role = 'system' } = {}) {
  const db = getDb();
  const result = changeStatus(contentId, 'published', { role, note: publishedUrl });
  db.prepare('UPDATE contents SET published_url = ?, published_at = datetime(?) WHERE id = ?')
    .run(publishedUrl, new Date().toISOString(), contentId);
  return result;
}

/**
 * 검수 요청
 */
export function submitForReview(contentId, { role = 'content_manager' } = {}) {
  return changeStatus(contentId, 'review', { role, note: '검수 요청' });
}

/**
 * 팀 활동 로그 기록
 */
function logActivity(db, { role, action, contentId, note }) {
  db.prepare(`
    INSERT INTO team_logs (user_role, action, content_id, note)
    VALUES (?, ?, ?, ?)
  `).run(role, action, contentId || null, note || null);
}

/**
 * 팀 활동 로그 조회
 */
export function getTeamLogs(limit = 50) {
  const db = getDb();
  return db.prepare(`
    SELECT tl.*, c.title as content_title
    FROM team_logs tl
    LEFT JOIN contents c ON c.id = tl.content_id
    ORDER BY tl.created_at DESC LIMIT ?
  `).all(limit);
}
