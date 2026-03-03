/**
 * 발행 큐 관리자
 * approved 상태의 콘텐츠를 타입별로 발행 함수에 디스패치한다.
 * 실패 시 최대 3회 재시도. 결과를 DB에 업데이트.
 *
 * 사용법: node src/publish/queue.js [--dry-run]
 */

import { getDb } from '../shared/db.js';
import { publishToNaverBlog } from './naver-blog.js';
import { publishToInstagram } from './instagram.js';

const MAX_RETRIES = 3;

// 타입 → 발행 함수 매핑
const PUBLISHERS = {
  blog_expert: publishToNaverBlog,
  blog_general: publishToNaverBlog,
  card_news: publishToInstagram,
  // short_video: TODO
};

/**
 * 발행 대기 큐를 처리한다.
 * @param {object} options - { dryRun: boolean }
 */
export async function processQueue(options = {}) {
  const { dryRun = false } = options;
  const db = getDb();

  // approved 콘텐츠 조회
  const pending = db.prepare(
    `SELECT id, type, title FROM contents WHERE status = 'approved' ORDER BY created_at ASC`
  ).all();

  if (pending.length === 0) {
    console.log('📭 발행 대기 콘텐츠 없음');
    return { processed: 0, success: 0, failed: 0 };
  }

  console.log(`\n📬 발행 대기: ${pending.length}건`);
  console.log('─'.repeat(60));

  let success = 0;
  let failed = 0;

  for (const item of pending) {
    const publishFn = PUBLISHERS[item.type];
    if (!publishFn) {
      console.log(`⏭️  [${item.id}] ${item.type} — 발행 함수 없음, 건너뜀`);
      continue;
    }

    console.log(`\n▶ [${item.id}] ${item.type}: ${item.title?.substring(0, 50)}`);

    let result = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        result = await publishFn(item.id, { dryRun });
        if (result.success) break;
        console.warn(`  ⚠️ 시도 ${attempt}/${MAX_RETRIES} 실패: ${result.error}`);
      } catch (err) {
        console.error(`  ❌ 시도 ${attempt}/${MAX_RETRIES} 예외: ${err.message}`);
        result = { success: false, error: err.message };
      }

      if (attempt < MAX_RETRIES) {
        const wait = attempt * 5000;
        console.log(`  ⏳ ${wait / 1000}초 후 재시도...`);
        await new Promise(r => setTimeout(r, wait));
      }
    }

    if (result?.success) {
      success++;
      console.log(`  ✅ 성공${result.url ? ': ' + result.url : ''}`);
    } else {
      failed++;
      // 실패 시 status를 failed로
      if (!dryRun) {
        db.prepare(
          `UPDATE contents SET status = 'failed' WHERE id = ?`
        ).run(item.id);
      }
      console.log(`  ❌ 최종 실패: ${result?.error || 'unknown'}`);
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`📊 결과: 총 ${pending.length}건 / 성공 ${success} / 실패 ${failed}`);
  if (dryRun) console.log('   (DRY-RUN 모드)');

  return { processed: pending.length, success, failed };
}

// CLI 직접 실행
const isMain = process.argv[1]?.includes('queue.js') || process.argv[1]?.endsWith('publish/queue.js');
if (isMain) {
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('--dryrun') || true; // 기본 dry-run
  console.log(`🚀 발행 큐 처리 시작 (dryRun: ${dryRun})`);
  processQueue({ dryRun })
    .then(r => {
      console.log('\n✨ 완료:', r);
      process.exit(0);
    })
    .catch(err => {
      console.error('💥 큐 처리 실패:', err);
      process.exit(1);
    });
}

export default processQueue;
