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

// ── 불용어 리스트 (확장) ──
const STOPWORDS_KO = new Set([
  // 일반 불용어
  '있는', '하는', '되는', '그리고', '이런', '저런', '우리', '질문', '추천', '부탁',
  '합니다', '입니다', '네요', '있어요', '없어요', '해요', '같은', '어떤', '정말', '너무',
  '이거', '저거', '그거', '해서', '대한', '위한', '근데', '아니', '그냥', '진짜', '왜냐',
  '어떻게', '요즘', '좀', '제발', '사진', '영상', '우리개', '아가', '만약', '때문', '아직',
  '오늘', '내일', '어제', '나는', '여기', '거기', '저기', '하나', '이게', '그래', '이미',
  '이제', '아마', '원래', '다시', '그래서', '그런', '이번', '확인', '얘기', '다른',
  '혹시', 'ㅋㅋ', 'ㅎㅎ', '감사', '답변', '글쓰기', '검색', '제목', '작성', '수정',
  '삭제', '등록', '로그인', '회원', '카페', '블로그', '네이버', '다음', '구글',
  '갤러리', '공지', '이벤트', '댓글', '조회', '추천수', '스크랩', '공유', '신고',
  // 일반 동물 단어 (너무 흔해서 키워드로 무의미)
  '강아지', '고양이', '반려동물', '반려견', '반려묘', '멍멍이', '냥이', '펫',
]);

const STOPWORDS_EN = new Set([
  'the', 'and', 'for', 'this', 'that', 'with', 'from', 'have', 'has', 'her', 'his',
  'she', 'him', 'they', 'them', 'was', 'were', 'are', 'been', 'being', 'not', 'but',
  'all', 'can', 'had', 'just', 'got', 'get', 'how', 'our', 'out', 'about', 'what',
  'when', 'who', 'which', 'will', 'would', 'could', 'should', 'does', 'did', 'its',
  'any', 'your', 'you', 'cat', 'dog', 'cats', 'dogs', 'pet', 'pets', 'my', 'new',
  'one', 'like', 'now', 'day', 'back', 'after', 'over', 'some', 'very', 'why', 'much',
  'too', 'also', 'than', 'other', 'more', 'most', 'into', 'here', 'there',
  // 쓰레기 키워드로 자주 유입되는 영어 단어
  'year', 'years', 'old', 'months', 'month', 'week', 'weeks', 'help', 'need',
  'please', 'anyone', 'someone', 'every', 'really', 'still', 'never', 'always',
  'think', 'know', 'want', 'look', 'make', 'time', 'good', 'best', 'first',
  'last', 'long', 'only', 'come', 'take', 'thing', 'things', 'people', 'way',
  'said', 'each', 'tell', 'many', 'well', 'then', 'them', 'same', 'right',
  'going', 'been', 'made', 'sure', 'keep', 'even', 'give', 'went', 'doing',
]);

// ── 반려동물 주제 카테고리 ──
const PET_TOPIC_CATEGORIES = [
  // 사료/영양
  '사료', '간식', '영양', '그레인프리', '생식', '습식', '건식', '단백질', '첨가물', '급여', '급식', '먹이', '배식',
  'food', 'diet', 'nutrition', 'kibble', 'treat', 'raw', 'feeding',
  // 건강/질병
  '건강', '질병', '병원', '수의사', '진료', '예방접종', '접종', '백신', '중성화', '수술',
  '알러지', '알레르기', '피부', '소화', '설사', '구토', '비만', '다이어트', '체중',
  '위장', '장염', '관절', '디스크', '슬개골', '심장', '신장', '간', '췌장', '당뇨',
  '암', '종양', '결석', '방광', '요도', '귀염증', '외이염', '피부병', '탈모', '아토피',
  '구내염', '치석', '치주', '눈물', '눈곱', '기침', '감기', '켄넬코프', '범백', '파보',
  '코로나', '디스템퍼', '광견병', '기생충', '벼룩', '진드기', '심장사상충', '회충',
  'health', 'disease', 'vet', 'allergy', 'skin', 'weight', 'obesity', 'cancer',
  // 행동/훈련
  '훈련', '교육', '짖음', '분리불안', '공격성', '물림', '마킹', '배변', '대소변',
  '산책', '사회화', '복종', '클리커', '긍정강화', '행동교정', '스트레스',
  'training', 'behavior', 'anxiety', 'aggression', 'barking', 'socialization',
  // 품종/종류
  '품종', '믹스', '유기견', '유기묘', '입양', '분양', '브리더',
  '푸들', '말티즈', '치와와', '시츄', '비숑', '골든', '래브라도', '허스키', '진돗개', '시바',
  '코숏', '러시안블루', '페르시안', '브리티시', '스코티시', '랙돌', '벵갈', '샴',
  'breed', 'adoption', 'rescue', 'shelter', 'poodle', 'retriever',
  // 용품/관리
  '용품', '장난감', '하네스', '목줄', '리드줄', '캐리어', '케이지', '울타리',
  '미용', '목욕', '빗질', '발톱', '이빨', '양치', '그루밍', '샴푸',
  '보험', '펫보험', '동물병원', '약', '처방',
  // 생활
  '동거', '합사', '다묘', '다견', '고양이카페', '펫시터', '호텔', '위탁',
  '임보', '봉사', '동물보호', '학대', '유실', '실종', '칩', '등록',
];

const PET_TOPIC_SET = new Set(PET_TOPIC_CATEGORIES.map(w => w.toLowerCase()));

/**
 * 키워드가 반려동물 관련 주제인지 확인
 */
function isPetRelated(keyword) {
  const lower = keyword.toLowerCase();
  // 정확 매칭
  if (PET_TOPIC_SET.has(lower)) return true;
  // 부분 매칭: 키워드가 카테고리 단어를 포함하거나, 카테고리 단어가 키워드를 포함
  for (const topic of PET_TOPIC_CATEGORIES) {
    const t = topic.toLowerCase();
    if (lower.includes(t) || t.includes(lower)) return true;
  }
  return false;
}

function extractKeywords(posts) {
  const freq = {};

  // 개인정보 포함 게시글 제외
  const safePosts = posts.filter(p => !isPIIPost(p));

  for (const post of safePosts) {
    // title에서 키워드 추출: 2글자 이상 한글 단어 or 영단어
    const words = (post.title + ' ' + (post.body || '').slice(0, 200))
      .match(/[가-힣]{2,}|[a-zA-Z]{3,}/g) || [];

    for (const w of words) {
      // 불용어 필터링
      if (STOPWORDS_KO.has(w) || STOPWORDS_EN.has(w.toLowerCase())) continue;
      if (isBannedKeyword(w)) continue;
      // 2글자 한글은 반려동물 관련인지 확인 (너무 일반적인 단어 차단)
      if (/^[가-힣]{2}$/.test(w) && !isPetRelated(w)) continue;
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

  // 반려동물 주제 필터: 클러스터 내 키워드 중 하나라도 반려동물 관련이어야 함
  results = results.filter(r => {
    const clusterWords = r.cluster.split(',').map(s => s.trim());
    const hasPetTopic = clusterWords.some(w => isPetRelated(w));
    if (!hasPetTopic) {
      console.log(`[scorer] ❌ "${r.keyword}" — 반려동물 주제 아님, 제외`);
    }
    return hasPetTopic;
  });

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
