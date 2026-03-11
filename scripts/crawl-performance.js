/**
 * 성과 크롤링 스크립트
 * 사용법: node scripts/crawl-performance.js
 * 크론잡: 매일 1회 실행 권장
 * 
 * 지원 플랫폼:
 * - 네이버 블로그: HTML 파싱으로 조회수/좋아요/댓글 수집
 * - 유튜브: YouTube Data API v3 사용 (YOUTUBE_API_KEY 환경변수 필요)
 * - 인스타그램: 직접 크롤링 어려움 → 수동 입력 안내
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DATA_DIR = path.join(__dirname, '..', 'data');

// === 데이터 로드/저장 ===
function loadJSON(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8'));
}

function saveJSON(filename, data) {
  // content-db.json 저장 전 백업
  if (filename === 'content-db.json') {
    const src = path.join(DATA_DIR, filename);
    const backup = path.join(DATA_DIR, 'content-db-backup.json');
    try { fs.copyFileSync(src, backup); } catch (e) { /* 무시 */ }
  }
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
}

// === HTTP 요청 헬퍼 ===
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

// === 네이버 블로그 크롤러 ===
async function crawlNaverBlog(postId, blogId = 'lifelogics') {
  try {
    // 네이버 블로그 API 대안: PostView 페이지 파싱
    const url = `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${postId}&redirect=Dlog`;
    const { body } = await httpGet(url);

    // 조회수 추출 (다양한 패턴 시도)
    let views = 0;
    const viewMatch = body.match(/class="pcol2"[^>]*>(\d[\d,]*)</) ||
                      body.match(/"sympathyViewCount"\s*:\s*"?(\d+)"?/) ||
                      body.match(/"viewCount"\s*:\s*"?(\d+)"?/);
    if (viewMatch) views = parseInt(viewMatch[1].replace(/,/g, ''), 10);

    // 좋아요 추출
    let likes = 0;
    const likeMatch = body.match(/"sympathyCount"\s*:\s*"?(\d+)"?/) ||
                      body.match(/class="u_cnt _count"[^>]*>(\d+)</) ||
                      body.match(/"likeItCount"\s*:\s*"?(\d+)"?/);
    if (likeMatch) likes = parseInt(likeMatch[1], 10);

    // 댓글 수 추출
    let comments = 0;
    const commentMatch = body.match(/"commentCount"\s*:\s*"?(\d+)"?/) ||
                          body.match(/class="[^"]*comment_count[^"]*"[^>]*>(\d+)</) ||
                          body.match(/"totalCount"\s*:\s*"?(\d+)"?/);
    if (commentMatch) comments = parseInt(commentMatch[1], 10);

    console.log(`  ✅ 네이버 블로그 ${postId}: 조회 ${views}, 좋아요 ${likes}, 댓글 ${comments}`);
    return { views, likes, comments, shares: 0 };
  } catch (e) {
    console.log(`  ❌ 네이버 블로그 ${postId} 크롤링 실패: ${e.message}`);
    return null;
  }
}

// === 유튜브 크롤러 ===
async function crawlYouTube(videoId) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.log('  ⚠️  YOUTUBE_API_KEY 환경변수가 설정되지 않았습니다. 유튜브 크롤링을 건너뜁니다.');
    return null;
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`;
    const { body } = await httpGet(url);
    const data = JSON.parse(body);

    if (!data.items || data.items.length === 0) {
      console.log(`  ❌ 유튜브 ${videoId}: 영상을 찾을 수 없습니다`);
      return null;
    }

    const stats = data.items[0].statistics;
    const result = {
      views: parseInt(stats.viewCount || 0, 10),
      likes: parseInt(stats.likeCount || 0, 10),
      comments: parseInt(stats.commentCount || 0, 10),
      shares: 0 // YouTube API에서 공유 수는 제공하지 않음
    };
    console.log(`  ✅ 유튜브 ${videoId}: 조회 ${result.views}, 좋아요 ${result.likes}, 댓글 ${result.comments}`);
    return result;
  } catch (e) {
    console.log(`  ❌ 유튜브 ${videoId} 크롤링 실패: ${e.message}`);
    return null;
  }
}

// === 인스타그램 (수동 안내) ===
async function crawlInstagram(postId) {
  console.log(`  ⚠️  인스타그램 ${postId}: 직접 크롤링 미지원. 수동으로 메트릭을 업데이트해주세요.`);
  console.log(`     PUT /api/topics/:cat/:sub/:idx/publish/:pubIdx/metrics`);
  return null;
}

// === 블로그 ID 추출 ===
function extractBlogId(url) {
  if (!url) return 'lifelogics';
  const match = url.match(/blog\.naver\.com\/([^/?#]+)/);
  return match ? match[1] : 'lifelogics';
}

// === 메인 크롤링 함수 ===
async function main() {
  console.log('🔄 성과 크롤링 시작...', new Date().toLocaleString('ko-KR'));
  console.log('─'.repeat(50));

  const accounts = loadJSON('accounts.json');
  const contentDB = loadJSON('content-db.json');

  // crawlEnabled인 계정 필터
  const activeAccounts = accounts.accounts.filter(a => a.crawlEnabled);
  console.log(`📋 활성 계정: ${activeAccounts.length}개`);

  // 모든 publications 수집
  let crawled = 0;
  let updated = 0;
  let skipped = 0;

  for (const cat of contentDB.categories) {
    for (const sub of cat.subcategories) {
      for (const topic of sub.topics) {
        if (!topic.publications || topic.publications.length === 0) continue;

        for (const pub of topic.publications) {
          // 활성 계정의 발행물만 크롤링
          const account = activeAccounts.find(a => a.id === pub.accountId);
          if (!account) { skipped++; continue; }
          if (!pub.postId) { skipped++; continue; }

          crawled++;
          let newMetrics = null;

          // 플랫폼별 크롤링
          switch (account.platform) {
            case 'naver-blog':
              const blogId = extractBlogId(account.url);
              newMetrics = await crawlNaverBlog(pub.postId, blogId);
              break;
            case 'youtube':
              newMetrics = await crawlYouTube(pub.postId);
              break;
            case 'instagram':
              newMetrics = await crawlInstagram(pub.postId);
              break;
            default:
              console.log(`  ⚠️  ${account.platform}: 지원하지 않는 플랫폼`);
          }

          if (newMetrics) {
            // 이전 메트릭을 히스토리에 저장
            if (pub.metrics && pub.metrics.lastCrawled) {
              pub.metricsHistory = pub.metricsHistory || [];
              pub.metricsHistory.push({ ...pub.metrics });

              // 히스토리 최대 90일 유지
              if (pub.metricsHistory.length > 90) {
                pub.metricsHistory = pub.metricsHistory.slice(-90);
              }
            }
            // 메트릭 업데이트
            pub.metrics = {
              ...newMetrics,
              lastCrawled: new Date().toISOString()
            };
            updated++;
          }

          // rate limit 방지: 200ms 딜레이
          await new Promise(r => setTimeout(r, 200));
        }
      }
    }
  }

  // 저장
  if (updated > 0) {
    saveJSON('content-db.json', contentDB);
    console.log(`\n✅ content-db.json 저장 완료 (백업 생성됨)`);
  }

  console.log('─'.repeat(50));
  console.log(`📊 크롤링 완료!`);
  console.log(`   크롤링 시도: ${crawled}건`);
  console.log(`   업데이트: ${updated}건`);
  console.log(`   스킵: ${skipped}건`);
  console.log('');
}

main().catch(e => {
  console.error('❌ 크롤링 오류:', e);
  process.exit(1);
});
