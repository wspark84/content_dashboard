#!/usr/bin/env node
/**
 * 카페 크롤링 데이터 → 콘텐츠화 가능한 주제만 필터링 → content-db.json 반영
 * 
 * 필터 기준:
 * 1. 조회수 높은 글 (카페별 상위 조회수)
 * 2. 콘텐츠화 가능 키워드 (제품/사료/건강/질병/행동/이슈)
 * 3. 노이즈 제거 (분양/홍보/인사/잡담)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const CAFE_FILE = path.join(DATA_DIR, 'cafe-monitor.json');
const DB_FILE = path.join(DATA_DIR, 'content-db.json');
const FILTERED_FILE = path.join(DATA_DIR, 'cafe-filtered.json');

// ===== 콘텐츠화 가능 키워드 =====
const CONTENT_KEYWORDS = [
  // 제품/사료 이슈
  '사료', '간식', '보충제', '영양제', '처방식', '그레인프리', '생식', '화식', '습식',
  '리콜', '성분', '첨가물', '방부제', '원재료', '브랜드', '추천', '비교', '후기',
  // 건강/질병
  '병원', '수술', '진단', '약', '치료', '증상', '검사', '예방접종', '중성화',
  '구토', '설사', '혈변', '기침', '재채기', '피부', '알레르기', '아토피', '탈모',
  '결석', '신장', '간', '심장', '관절', '디스크', '슬개골', '치주', '치석',
  '종양', '암', '당뇨', '갑상선', '비만', '다이어트', '체중',
  // 행동/훈련
  '입질', '짖음', '분리불안', '공격성', '사회화', '훈련', '교육', '배변',
  '마킹', '스트레스', '행동', '문제행동',
  // 생활/케어
  '목욕', '미용', '그루밍', '양치', '발톱', '귀청소', '눈물자국',
  '산책', '운동', '장난감', '하네스', '목줄', '캐리어',
  '노견', '시니어', '퍼피', '새끼',
  // 이슈/사건
  '리콜', '사고', '중독', '실종', '유기', '학대', '법', '조례',
  '보험', '진료비', '비용',
];

// ===== 노이즈 제거 키워드 =====
const NOISE_KEYWORDS = [
  '안녕하세요', '반가워', '가입인사', '인사드려', '자기소개',
  '분양', '무료분양', '유상분양', '입양합니다', '입양 보내',
  '홍보', '광고', '이벤트', '체험단', '모집',
  '사전등록', '페어', '박람회',
  '오늘 뭔가', '날씨', '일상', '출석',
  '궁금해서요', '오랜만에', '피곤한',
  '스티커', 'PNG',
  '죄송합니다',
];

function isContentWorthy(article) {
  const title = article.title || '';
  const titleLower = title.toLowerCase();
  
  // 1. 노이즈 제거
  for (const kw of NOISE_KEYWORDS) {
    if (title.includes(kw)) return false;
  }
  
  // 2. 제목 너무 짧으면 제외 (5자 미만)
  if (title.length < 5) return false;
  
  // 3. 조회수 기준 (높은 조회수 = 관심 높은 주제)
  const views = article.views || 0;
  if (views >= 500) return true; // 500뷰 이상은 무조건 포함
  
  // 4. 키워드 매칭
  let keywordMatch = false;
  for (const kw of CONTENT_KEYWORDS) {
    if (title.includes(kw)) {
      keywordMatch = true;
      break;
    }
  }
  
  // 키워드 매칭 + 최소 조회수 50 이상
  if (keywordMatch && views >= 50) return true;
  
  // 키워드 매칭 + 조회수 정보 없을 때도 포함 (크롤링 직후)
  if (keywordMatch && views === 0) return true;
  
  return false;
}

function categorizeArticle(article) {
  const title = article.title || '';
  
  // 카테고리 분류
  const categories = {
    '제품/사료 이슈': ['사료', '간식', '보충제', '영양제', '처방식', '그레인프리', '생식', '화식', '습식', '리콜', '성분', '브랜드', '추천', '비교', '후기', '원재료'],
    '건강/질병 정보': ['병원', '수술', '진단', '약', '치료', '증상', '검사', '예방접종', '중성화', '구토', '설사', '혈변', '피부', '알레르기', '결석', '신장', '간', '심장', '관절', '슬개골', '치주', '종양', '당뇨', '비만'],
    '행동/훈련': ['입질', '짖음', '분리불안', '공격성', '사회화', '훈련', '교육', '배변', '마킹', '행동', '문제행동'],
    '케어/생활': ['목욕', '미용', '그루밍', '양치', '발톱', '귀청소', '눈물자국', '산책', '운동', '노견', '시니어', '퍼피'],
    '사건/이슈': ['사고', '중독', '실종', '유기', '학대', '법', '보험', '진료비'],
  };
  
  for (const [cat, keywords] of Object.entries(categories)) {
    for (const kw of keywords) {
      if (title.includes(kw)) return cat;
    }
  }
  
  return '기타 인기글';
}

function generateEasyContent(article, cafeInfo) {
  const title = article.title;
  const views = article.views || 0;
  const cafe = cafeInfo.name;
  const viewText = views > 0 ? `조회수 ${views.toLocaleString()}회를 기록한 인기글이에요.` : '많은 관심을 받고 있는 글이에요.';
  
  return `한 줄 요약: ${title}

왜 중요할까요?

${cafe} 카페에서 ${viewText} 반려인들이 실제로 궁금해하고 관심 가지는 주제예요.

핵심 포인트

- 실제 반려인들의 경험과 고민이 담긴 주제예요
- 카페에서 활발한 토론이 이뤄지고 있어요
- 콘텐츠로 만들면 높은 공감과 참여를 기대할 수 있어요

꼭 기억하세요!

이 주제로 콘텐츠를 제작할 때는 정확한 수의학적 정보를 바탕으로 작성해야 해요.`;
}

function main() {
  if (!fs.existsSync(CAFE_FILE)) {
    console.error('❌ cafe-monitor.json 없음. 크롤링 먼저 실행하세요.');
    process.exit(1);
  }
  
  const cafeData = JSON.parse(fs.readFileSync(CAFE_FILE, 'utf-8'));
  const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  
  const filtered = {
    lastFiltered: new Date().toISOString(),
    source: cafeData.lastCrawled,
    topics: []
  };
  
  // 각 카페에서 콘텐츠화 가능한 글 필터링
  const dogTopics = [];
  const catTopics = [];
  
  for (const [cafeId, info] of Object.entries(cafeData.cafes)) {
    let cafeFiltered = 0;
    
    for (const article of info.articles) {
      if (isContentWorthy(article)) {
        const category = categorizeArticle(article);
        const topic = {
          title: article.title.replace(/\s+/g, ' ').trim(),
          animal: info.animal,
          source: `${info.name} (${info.url})`,
          sourceType: 'naver-cafe',
          cafeId,
          articleId: article.articleId || '',
          link: article.link || '',
          views: article.views || 0,
          date: article.date || '',
          author: article.author || '',
          contentCategory: category,
          summary: `[${info.name}] ${article.title} (${category})`,
          fullContent: `<h3>📌 카페 인기글 분석</h3>\n<p><strong>출처:</strong> ${info.name} 카페</p>\n<p><strong>조회수:</strong> ${(article.views || 0).toLocaleString()}회</p>\n<p><strong>분류:</strong> ${category}</p>\n<p>이 주제는 네이버 반려동물 카페에서 높은 관심을 받은 글입니다. 실제 보호자들의 경험과 고민이 담겨 있어 콘텐츠 소재로 활용 가치가 높습니다.</p>`,
          easyContent: generateEasyContent(article, info),
          imagePrompts: [
            { section: '대표 이미지', prompt: `A cute ${info.animal === '강아지' ? 'dog' : 'cat'} in a cozy Korean home, warm natural lighting, photorealistic, No text, no watermark, no logo`, style: 'photorealistic' }
          ],
          tags: [info.animal, info.name, category, '카페 모니터링'],
          viralScore: Math.min(100, Math.floor((article.views || 0) / 100)),
          difficulty: '초급',
          targetAudience: '반려인',
          crawledAt: article.crawledAt || new Date().toISOString()
        };
        
        filtered.topics.push(topic);
        
        if (info.animal === '강아지') dogTopics.push(topic);
        else catTopics.push(topic);
        
        cafeFiltered++;
      }
    }
    
    console.log(`${info.name}: ${info.articles.length}개 중 ${cafeFiltered}개 선별`);
  }
  
  // 필터링 결과 저장
  fs.writeFileSync(FILTERED_FILE, JSON.stringify(filtered, null, 2));
  
  // content-db.json 업데이트
  let cafeIdx = dbData.categories.findIndex(c => c.name === '국내 카페 모니터링');
  
  const cafeCategory = {
    name: '국내 카페 모니터링',
    description: '네이버 반려동물 카페 인기글 중 콘텐츠화 가능한 주제 선별',
    lastUpdated: new Date().toISOString(),
    subcategories: [
      {
        name: '강아지 카페 이슈',
        description: '강사모, 아라뱃길비숑 — 제품/건강/행동 이슈',
        topics: dogTopics
      },
      {
        name: '고양이 카페 이슈',
        description: '고다행, 냥이네 — 제품/건강/행동 이슈',
        topics: catTopics
      }
    ]
  };
  
  if (cafeIdx >= 0) {
    dbData.categories[cafeIdx] = cafeCategory;
  } else {
    dbData.categories.push(cafeCategory);
  }
  
  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2));
  
  // 검증
  JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  
  const total = dbData.categories.reduce((sum, c) => 
    sum + (c.subcategories || []).reduce((s, sub) => s + (sub.topics || []).length, 0), 0);
  
  console.log(`\n📊 필터링 결과:`);
  console.log(`  전체 크롤링: ${Object.values(cafeData.cafes).reduce((s, c) => s + c.articles.length, 0)}개`);
  console.log(`  콘텐츠 선별: ${filtered.topics.length}개`);
  console.log(`    강아지: ${dogTopics.length}개`);
  console.log(`    고양이: ${catTopics.length}개`);
  console.log(`  DB 전체: ${total}개 토픽`);
  
  // 카테고리별 분류
  const catCounts = {};
  for (const t of filtered.topics) {
    catCounts[t.contentCategory] = (catCounts[t.contentCategory] || 0) + 1;
  }
  console.log(`\n📂 카테고리별:`);
  for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}개`);
  }
}

main();
