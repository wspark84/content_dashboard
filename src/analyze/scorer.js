/**
 * 바이럴 스코어링 엔진
 * raw_posts → 키워드 추출 → 스코어 계산 → trending_topics INSERT
 */

import { getDb } from '../shared/db.js';
import { config } from '../shared/config.js';
import { estimateSearchVolume, getBlogCompetition } from './keyword.js';
import { clusterKeywords } from './cluster.js';

const WEIGHTS = config.scoring;

// 사료 관련 키워드
const FEED_KEYWORDS = [
  '사료', '간식', '알러지', '알레르기', '피부', '소화', '설사', '구토',
  '영양', '그레인프리', '생식', '습식', '건식', '단백질', '첨가물',
  'food', 'diet', 'allergy', 'nutrition', 'grain-free', 'raw',
  '비만', '다이어트', '체중', '위장', '장염', 'kibble', 'treat',
];

/**
 * raw_posts에서 키워드 추출 (title 기반)
 */
// 개인정보 포함 게시글 필터 (전화번호, 주민번호 등)
const PII_PATTERNS = [
  /01[016789]-?\d{3,4}-?\d{4}/,  // 한국 전화번호
  /\d{6}-?\d{7}/,                 // 주민등록번호
];

// 욕설/스팸 키워드 필터
const BANNED_KEYWORDS = new Set([
  '씹', '좆', '병신', '새끼', '지랄', '미친', '분탕', '전번', '여기서',
  '할배', '발작', '머리털', '대머리',
]);

function isPIIPost(post) {
  const text = (post.title || '') + ' ' + (post.body || '');
  return PII_PATTERNS.some(p => p.test(text));
}

function isBannedKeyword(word) {
  return BANNED_KEYWORDS.has(word) || [...BANNED_KEYWORDS].some(b => word.includes(b));
}

function extractKeywords(posts) {
  const freq = {};

  // 개인정보 포함 게시글 제외
  const safePosts = posts.filter(p => !isPIIPost(p));

  for (const post of safePosts) {
    // title에서 키워드 추출: 2글자 이상 한글 단어 or 영단어
    const words = (post.title + ' ' + (post.body || '').slice(0, 200))
      .match(/[가-힣]{2,}|[a-zA-Z]{3,}/g) || [];

    // 불용어 제거
    const stopwords = new Set(['있는', '하는', '되는', '그리고', '이런', '저런', '우리', '강아지', '고양이', '질문', '추천', '부탁', '합니다', '입니다', '네요', '있어요', '없어요', '해요', '같은', '어떤', '정말', '너무', '이거', '저거', '그거', '해서', '대한', '위한', '근데', '아니', '그냥', '진짜', '왜냐', '어떻게', '요즘', '좀', '제발', '사진', '영상', '우리개', '아가', '만약', '때문', '아직', '오늘', '내일', '어제', '나는', '여기', '거기', '저기', '하나', '이게', '그래', '이미', '이제', '아마', '아직', '원래', '다시', '그래서', '그런', '이번', '확인', '얘기', '다른', 'the', 'and', 'for', 'this', 'that', 'with', 'from', 'have', 'has', 'her', 'his', 'she', 'him', 'they', 'them', 'was', 'were', 'are', 'been', 'being', 'not', 'but', 'all', 'can', 'had', 'just', 'got', 'get', 'how', 'our', 'out', 'about', 'what', 'when', 'who', 'which', 'will', 'would', 'could', 'should', 'does', 'did', 'been', 'its', 'any', 'your', 'you', 'cat', 'dog', 'cats', 'dogs', 'pet', 'pets', 'my', 'new', 'one', 'like', 'now', 'day', 'back', 'after', 'over', 'some', 'very', 'why', 'much', 'too', 'also', 'than', 'other', 'more', 'most', 'into', 'here', 'there']);

    for (const w of words) {
      if (stopwords.has(w)) continue;
      if (isBannedKeyword(w)) continue;
      if (!freq[w]) freq[w] = { count: 0, posts: [] };
      freq[w].count++;
      if (freq[w].posts.length < 5) freq[w].posts.push(post);
    }
  }

  return freq;
}

/**
 * 커뮤니티 열기 스코어 (0~100)
 */
function calcCommunityHeat(posts) {
  if (posts.length === 0) return 0;
  const totalEngagement = posts.reduce((sum, p) => sum + (p.views || 0) + (p.comments || 0) * 10 + (p.likes || 0) * 5, 0);
  // 정규화: 로그 스케일
  return Math.min(100, Math.round(Math.log2(totalEngagement + 1) * 8));
}

/**
 * 해외 트렌드 스코어 (0~100)
 */
function calcGlobalTrend(posts) {
  const redditPosts = posts.filter(p => p.source === 'reddit');
  if (redditPosts.length === 0) return 0;
  const maxUpvotes = Math.max(...redditPosts.map(p => p.likes || 0));
  return Math.min(100, Math.round(Math.log2(maxUpvotes + 1) * 10));
}

/**
 * 사료 연결성 스코어 (0~100)
 */
function calcFeedMatch(keyword) {
  const lower = keyword.toLowerCase();
  const matches = FEED_KEYWORDS.filter(fk => lower.includes(fk) || fk.includes(lower));
  if (matches.length >= 2) return 100;
  if (matches.length === 1) return 70;
  // 부분 매칭
  if (FEED_KEYWORDS.some(fk => lower.includes(fk.slice(0, 2)))) return 30;
  return 0;
}

/**
 * 시의성 스코어 (0~100)
 */
function calcTimeliness(posts) {
  const now = Date.now();
  const h24 = 24 * 60 * 60 * 1000;
  const recent = posts.filter(p => {
    const t = p.published_at || p.crawled_at;
    return t && (now - new Date(t).getTime()) < h24;
  });
  if (recent.length >= 3) return 100;
  if (recent.length >= 1) return 60;
  return 10;
}

/**
 * 경쟁 공백 스코어 (0~100) — 블로그 결과 수 역수
 */
function calcCompetitionGap(blogCount) {
  if (blogCount <= 100) return 100;
  if (blogCount <= 1000) return 80;
  if (blogCount <= 10000) return 50;
  if (blogCount <= 100000) return 20;
  return 5;
}

/**
 * 전체 스코어 계산
 */
function computeScore(components) {
  return (
    components.communityHeat * WEIGHTS.communityHeat +
    components.searchDemand * WEIGHTS.searchDemand +
    components.globalTrend * WEIGHTS.globalTrend +
    components.feedMatch * WEIGHTS.feedMatch +
    components.timeliness * WEIGHTS.timeliness +
    components.competitionGap * WEIGHTS.competitionGap
  );
}

/**
 * 메인: raw_posts 분석 → trending_topics 생성
 */
export async function runScoring() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  // 최근 48시간 raw_posts
  const posts = db.prepare(`
    SELECT * FROM raw_posts 
    WHERE crawled_at >= datetime('now', '-48 hours')
    ORDER BY crawled_at DESC
  `).all();

  if (posts.length === 0) {
    console.log('[scorer] raw_posts 비어있음 — 빈 결과 반환');
    return [];
  }

  console.log(`[scorer] ${posts.length}개 포스트 분석 중...`);

  // 키워드 추출
  const freq = extractKeywords(posts);

  // 빈도 2 이상만
  const keywords = Object.entries(freq)
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 30);

  if (keywords.length === 0) {
    console.log('[scorer] 빈도 2 이상 키워드 없음');
    return [];
  }

  // 클러스터링
  const clusters = clusterKeywords(keywords.map(([kw]) => kw));

  // 스코어 계산 (클러스터 대표 키워드 기준)
  const results = [];

  for (const cluster of clusters) {
    const mainKw = cluster.keywords[0];
    const relatedPosts = freq[mainKw]?.posts || [];

    const communityHeat = calcCommunityHeat(relatedPosts);
    const searchDemand = await estimateSearchVolume(mainKw);
    const globalTrend = calcGlobalTrend(relatedPosts);
    const feedMatch = calcFeedMatch(mainKw);
    const timeliness = calcTimeliness(relatedPosts);
    const blogCount = await getBlogCompetition(mainKw);
    const competitionGap = calcCompetitionGap(blogCount);

    const score = computeScore({ communityHeat, searchDemand, globalTrend, feedMatch, timeliness, competitionGap });

    const sources = [...new Set(relatedPosts.map(p => p.source))];
    const questions = relatedPosts.slice(0, 3).map(p => p.title);

    results.push({
      keyword: cluster.label,
      cluster: cluster.keywords.join(', '),
      score: Math.round(score * 10) / 10,
      communityHeat, searchDemand, globalTrend, feedMatch, timeliness, competitionGap,
      sources: JSON.stringify(sources),
      sampleQuestions: JSON.stringify(questions),
    });
  }

  // DB INSERT
  const insert = db.prepare(`
    INSERT OR REPLACE INTO trending_topics 
    (date, keyword, cluster, score, community_heat, search_volume, global_trend, feed_match_count, timeliness, competition_gap, sources, sample_questions, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);

  const insertMany = db.transaction((items) => {
    for (const r of items) {
      insert.run(today, r.keyword, r.cluster, r.score, r.communityHeat, r.searchDemand, r.globalTrend, r.feedMatch, r.timeliness, r.competitionGap, r.sources, r.sampleQuestions);
    }
  });

  insertMany(results);
  console.log(`[scorer] ${results.length}개 트렌딩 토픽 저장 완료`);

  return results.sort((a, b) => b.score - a.score);
}
