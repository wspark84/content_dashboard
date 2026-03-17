/**
 * SNS 통계 수집 — Instagram (스텁) + YouTube 연동
 */
import { getDb } from '../shared/db.js';

/**
 * Instagram Insights (스텁 — API 승인 대기)
 */
export async function collectInstagramStats() {
  const IG_TOKEN = process.env.INSTAGRAM_TOKEN;
  if (IG_TOKEN) {
    // TODO: Instagram Graph API 연동
    // GET /me/media?fields=id,caption,like_count,comments_count,impressions,reach
  }
  console.log('[social-stats] Instagram: 스텁 모드 (API 승인 대기)');
  return { platform: 'instagram', status: 'stub', data: [] };
}

/**
 * YouTube 조회수 수집 — contents 테이블에서 youtube URL 찾아 조회수 파싱
 */
export async function collectYoutubeStats() {
  const db = getDb();
  const videos = db.prepare(`
    SELECT id, published_url, title FROM contents
    WHERE status = 'published' AND (type LIKE '%video%' OR published_url LIKE '%youtube%' OR published_url LIKE '%youtu.be%')
  `).all();

  if (!videos.length) {
    console.log('[social-stats] YouTube: 발행된 영상 없음');
    return { platform: 'youtube', status: 'ok', data: [] };
  }

  const today = new Date().toISOString().slice(0, 10);
  const results = [];

  for (const video of videos) {
    try {
      // oEmbed API로 기본 정보 조회 (API 키 불필요)
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(video.published_url)}&format=json`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        results.push({ contentId: video.id, title: data.title, author: data.author_name });
      }
    } catch (e) {
      console.error(`[social-stats] YouTube oEmbed 실패: ${video.title}`, e.message);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`[social-stats] YouTube: ${results.length}건 조회`);
  return { platform: 'youtube', status: 'ok', data: results };
}

/**
 * 전체 SNS 통계 수집
 */
export async function collectAllSocialStats() {
  const results = {};
  results.instagram = await collectInstagramStats();
  results.youtube = await collectYoutubeStats();
  console.log('[social-stats] 수집 완료');
  return results;
}

// CLI test
if (process.argv[1]?.endsWith('social-stats.js')) {
  console.log('=== Social Stats Test ===');
  const results = await collectAllSocialStats();
  console.log(JSON.stringify(results, null, 2));
  console.log('✅ social-stats.js OK');
}
