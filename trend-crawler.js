/**
 * 트렌드 자동 크롤러 — 반려동물 최신 뉴스/이슈 수집
 * 네이버 뉴스 + Google News 크롤링 → content-db.json 트렌드분석 카테고리에 자동 추가
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DB_PATH = path.join(__dirname, 'data', 'content-db.json');
const TREND_LOG = path.join(__dirname, 'data', 'trend-log.json');

// 검색 키워드 (반려동물 트렌드 포착)
const KEYWORDS = [
  '반려동물 트렌드',
  '강아지 사료 리콜',
  '고양이 건강 주의보',
  '반려동물 신제품',
  '펫 산업 뉴스',
  '동물병원 이슈',
  '반려동물 정책',
  '펫푸드 안전',
  '반려견 훈련',
  '고양이 행동 문제',
  '반려동물 보험',
  '펫테크 스타트업'
];

// 바이럴 스코어 키워드 가중치
const VIRAL_KEYWORDS = {
  '리콜': 15, '위험': 12, '주의': 10, '경고': 12, '사망': 15,
  '논란': 12, '충격': 10, '최초': 8, '무료': 8, '변화': 6,
  '신제품': 7, '트렌드': 6, '혁신': 8, '할인': 5, '법안': 7,
  '사건': 10, '급증': 8, '폭로': 12, '비교': 6, '순위': 6
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9'
      },
      timeout: 10000
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// 네이버 뉴스 검색 파싱
async function crawlNaverNews(keyword) {
  const results = [];
  try {
    const url = `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(keyword)}&sort=1&pd=4`;
    const html = await fetchUrl(url);
    
    // 뉴스 제목과 설명 추출
    const titleRegex = /class="news_tit"[^>]*title="([^"]+)"/g;
    const descRegex = /class="api_txt_lines dsc_txt_wrap"[^>]*>([^<]+)/g;
    
    let match;
    const titles = [];
    const descs = [];
    
    while ((match = titleRegex.exec(html)) !== null) {
      titles.push(match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"'));
    }
    while ((match = descRegex.exec(html)) !== null) {
      descs.push(match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim());
    }
    
    for (let i = 0; i < Math.min(titles.length, 5); i++) {
      results.push({
        title: titles[i],
        description: descs[i] || titles[i],
        source: 'naver',
        keyword
      });
    }
  } catch (e) {
    console.log(`[네이버] "${keyword}" 크롤링 실패: ${e.message}`);
  }
  return results;
}

// Google 뉴스 검색
async function crawlGoogleNews(keyword) {
  const results = [];
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&tbm=nws&hl=ko&gl=kr&num=5&tbs=qdr:w`;
    const html = await fetchUrl(url);
    
    // Google 뉴스 제목 추출
    const regex = /<div[^>]*class="[^"]*BNeawe[^"]*"[^>]*>([^<]{15,100})<\/div>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const title = match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").trim();
      if (title.length > 15 && !title.includes('http') && !results.find(r => r.title === title)) {
        results.push({
          title,
          description: title,
          source: 'google',
          keyword
        });
      }
    }
  } catch (e) {
    console.log(`[구글] "${keyword}" 크롤링 실패: ${e.message}`);
  }
  return results.slice(0, 5);
}

// 바이럴 스코어 계산
function calcViralScore(title, description) {
  let score = 60; // 기본 점수
  const text = (title + ' ' + description).toLowerCase();
  
  for (const [kw, weight] of Object.entries(VIRAL_KEYWORDS)) {
    if (text.includes(kw)) score += weight;
  }
  
  // 제목 길이 보너스 (적절한 길이)
  if (title.length >= 15 && title.length <= 40) score += 5;
  
  // 질문형/감정형 보너스
  if (title.includes('?') || title.includes('!')) score += 3;
  
  return Math.min(99, Math.max(50, score));
}

// 동물 타입 추론
function inferAnimal(title, desc) {
  const text = (title + ' ' + desc).toLowerCase();
  const dogWords = ['강아지', '개', '반려견', '퍼피', '댕댕이', '견종'];
  const catWords = ['고양이', '냥이', '묘종', '캣', '반려묘', '냥냥'];
  
  const hasDog = dogWords.some(w => text.includes(w));
  const hasCat = catWords.some(w => text.includes(w));
  
  if (hasDog && hasCat) return 'both';
  if (hasDog) return 'dog';
  if (hasCat) return 'cat';
  return 'both';
}

// 서브카테고리 추론
function inferSubcategory(title, desc) {
  const text = (title + ' ' + desc).toLowerCase();
  
  const categories = {
    'trend-news': ['뉴스', '정책', '법안', '규제', '시장', '산업', '투자', '매출', '보험', '지원'],
    'trend-issue': ['리콜', '사건', '논란', '위험', '경고', '주의', '사망', '폭로', '문제', '사고'],
    'trend-product': ['신제품', '출시', '브랜드', '사료', '용품', '할인', '추천', '비교', '리뷰']
  };
  
  let best = 'trend-news';
  let bestScore = 0;
  
  for (const [cat, keywords] of Object.entries(categories)) {
    const score = keywords.filter(k => text.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  return best;
}

// 태그 추출
function extractTags(title, desc) {
  const text = title + ' ' + desc;
  const tagPool = [
    '사료', '건강', '영양', '질병', '예방', '트렌드', '정책', '안전',
    '리콜', '신제품', '보험', '훈련', '행동', '수의사', '동물병원',
    '펫푸드', '간식', '산책', '입양', '중성화', '예방접종', '기생충',
    '피부', '알러지', '비만', '노령', '스트레스', '분리불안'
  ];
  return tagPool.filter(t => text.includes(t)).slice(0, 5);
}

// 중복 체크
function isDuplicate(newTitle, existingTopics) {
  const normalized = newTitle.replace(/\s+/g, '').toLowerCase();
  return existingTopics.some(t => {
    const existing = t.title.replace(/\s+/g, '').toLowerCase();
    // 80% 이상 겹치면 중복으로 판단
    if (normalized === existing) return true;
    if (normalized.includes(existing) || existing.includes(normalized)) return true;
    // 단어 기반 유사도
    const words1 = new Set(newTitle.split(/\s+/));
    const words2 = new Set(t.title.split(/\s+/));
    const intersection = [...words1].filter(w => words2.has(w));
    return intersection.length / Math.max(words1.size, words2.size) > 0.7;
  });
}

async function main() {
  console.log('🔍 반려동물 트렌드 크롤링 시작...\n');
  
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  
  // 트렌드분석 카테고리 확인/생성
  let trendCat = db.categories.find(c => c.id === 'trend');
  if (!trendCat) {
    trendCat = {
      id: 'trend',
      name: '트렌드분석',
      icon: '📈',
      subcategories: [
        { id: 'trend-news', name: '업계 뉴스', icon: '📰', topics: [] },
        { id: 'trend-issue', name: '이슈/사건', icon: '🚨', topics: [] },
        { id: 'trend-product', name: '제품/트렌드', icon: '🆕', topics: [] }
      ]
    };
    db.categories.push(trendCat);
  }
  
  // 기존 트렌드 토픽 수집 (중복 방지)
  const existingTopics = [];
  for (const sub of trendCat.subcategories) {
    existingTopics.push(...sub.topics);
  }
  
  // 크롤링
  const allResults = [];
  
  for (const kw of KEYWORDS) {
    console.log(`  크롤링: "${kw}"...`);
    const [naverResults, googleResults] = await Promise.all([
      crawlNaverNews(kw),
      crawlGoogleNews(kw)
    ]);
    allResults.push(...naverResults, ...googleResults);
    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n📊 총 ${allResults.length}건 수집\n`);
  
  // 중복 제거 및 토픽 변환
  let added = 0;
  const today = new Date().toISOString().split('T')[0];
  const seenTitles = new Set();
  
  for (const item of allResults) {
    // 자체 중복 제거
    const normTitle = item.title.replace(/\s+/g, '').toLowerCase();
    if (seenTitles.has(normTitle)) continue;
    seenTitles.add(normTitle);
    
    // 기존 토픽과 중복 체크
    if (isDuplicate(item.title, existingTopics)) continue;
    
    // 최소 길이 필터
    if (item.title.length < 10) continue;
    
    const subCatId = inferSubcategory(item.title, item.description);
    const topic = {
      id: `tr${Date.now()}-${added}`,
      title: item.title,
      description: item.description.slice(0, 200),
      tags: [...extractTags(item.title, item.description), item.keyword.split(' ')[0]],
      animal: inferAnimal(item.title, item.description),
      difficulty: 'basic',
      viralScore: calcViralScore(item.title, item.description),
      source: item.source,
      crawledAt: today
    };
    
    const subCat = trendCat.subcategories.find(s => s.id === subCatId);
    if (subCat) {
      subCat.topics.push(topic);
      existingTopics.push(topic);
      added++;
    }
  }
  
  // 각 서브카테고리 바이럴 스코어 순 정렬, 최대 30개 유지
  for (const sub of trendCat.subcategories) {
    sub.topics.sort((a, b) => b.viralScore - a.viralScore);
    if (sub.topics.length > 30) {
      sub.topics = sub.topics.slice(0, 30);
    }
  }
  
  // 저장
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  
  // 로그 저장
  const log = {
    lastRun: new Date().toISOString(),
    totalCrawled: allResults.length,
    newAdded: added,
    trendTotals: {}
  };
  for (const sub of trendCat.subcategories) {
    log.trendTotals[sub.name] = sub.topics.length;
  }
  fs.writeFileSync(TREND_LOG, JSON.stringify(log, null, 2), 'utf8');
  
  console.log(`✅ 트렌드 크롤링 완료!`);
  console.log(`   신규 추가: ${added}건`);
  for (const sub of trendCat.subcategories) {
    console.log(`   ${sub.icon} ${sub.name}: ${sub.topics.length}건`);
  }
}

main().catch(console.error);
