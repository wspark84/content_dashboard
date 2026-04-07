const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'content-db.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

const today = new Date().toISOString().split('T')[0];

let trendCat = db.categories.find(c => c.id === 'trends') || db.categories.find(c => c.id === 'trend');
if (!trendCat) {
  trendCat = {
    id: 'trends', name: '트렌드분석', icon: '📈',
    subcategories: [
      { id: 'trend-news', name: '업계 뉴스', icon: '📰', topics: [] },
      { id: 'trend-issue', name: '이슈/논란', icon: '🚨', topics: [] },
      { id: 'trend-product', name: '제품/서비스', icon: '🆕', topics: [] }
    ]
  };
  db.categories.push(trendCat);
}

// Update the topics with fresh data
const trends = {
  'trend-news': [
    {
      title: '3월 반려동물 동반 식당 합법화, 그 후의 현장',
      description: '식품위생법 개정으로 동반 출입이 허용되었지만, 현장에서는 예방접종 증명 등 까다로운 규제로 혼선이 빚어지고 있습니다.',
      tags: ['동반식당', '정책이슈', '펫프렌들리', '외식업'], animal: 'both', difficulty: 'basic', viralScore: 98
    },
    {
      title: '대구펫쇼 역대 최대 규모 폐막, 트렌드 분석',
      description: '3일간 2만 1천여 명이 방문한 제23회 대구펫쇼에서 확인된 2026년 반려동물 산업의 핵심 트렌드 5가지.',
      tags: ['대구펫쇼', '산업트렌드', '박람회', '신제품'], animal: 'both', difficulty: 'basic', viralScore: 82
    },
    {
      title: '정부 주도 "맹견 안전관리 캠페인" 본격화',
      description: '맹견 사고 증가에 따라 농식품부에서 맹견 보호자 책임과 안전 수칙을 강조하는 슬기로운 반려생활 캠페인을 시작했습니다.',
      tags: ['맹견', '안전관리', '정부정책', '캠페인'], animal: 'dog', difficulty: 'intermediate', viralScore: 85
    },
    {
      title: '보람그룹, 펫상조 라인업 "스카이펫" 대폭 강화',
      description: '상조업계의 펫시장 진출 가속화. 반려동물 전용 장례상품부터 생체보석 "펫츠비아"까지 다양한 프리미엄 서비스 소개.',
      tags: ['펫상조', '장례문화', '생체보석', '펫산업'], animal: 'both', difficulty: 'basic', viralScore: 78
    },
    {
      title: '반려동물 기부부터 의료보험까지, 달라진 반려문화',
      description: '단순한 돌봄을 넘어 반려동물 이름으로 기부하고 전용 보험에 가입하는 펫 휴머니제이션(Pet Humanization) 트렌드.',
      tags: ['펫휴머니제이션', '의료보험', '반려문화', '기부'], animal: 'both', difficulty: 'basic', viralScore: 88
    }
  ],
  'trend-issue': [
    {
      title: '오히려 늘어나는 "노펫존", 반려인과 비반려인의 갈등',
      description: '출입 허용 이후 오히려 문을 걸어 잠그는 식당들. 위생 우려와 반려인의 권리 사이, 타협점은 어디인가?',
      tags: ['노펫존', '사회적갈등', '동반식당', '펫티켓'], animal: 'both', difficulty: 'basic', viralScore: 96
    },
    {
      title: '까다로운 예방접종 증명, 모바일 백신앱이 뜬다',
      description: '식당 동반 시 예방접종 증명이 의무화되면서 종이 대신 스마트폰으로 간편하게 인증하는 모바일 앱 서비스가 급부상.',
      tags: ['모바일앱', '예방접종증명', '펫테크', 'IT'], animal: 'both', difficulty: 'intermediate', viralScore: 92
    },
    {
      title: '규정 위반 시 식당 영업정지? 과도한 규제 논란',
      description: '반려견이 식탁 위로 올라가거나 전용 의자를 쓰지 않으면 식당이 영업정지를 받을 수 있다는 규정에 자영업자들 반발.',
      tags: ['과도한규제', '영업정지', '식품위생법', '자영업'], animal: 'both', difficulty: 'basic', viralScore: 94
    }
  ],
  'trend-product': [
    {
      title: '종이 증명서는 안녕, "반려동물 모바일 예방접종 패스"',
      description: '식당 동반 필수템으로 자리잡은 모바일 백신 패스 앱들의 기능 비교와 수의사 데이터 연동 기술 리뷰.',
      tags: ['모바일패스', '백신인증', '펫테크', '앱리뷰'], animal: 'both', difficulty: 'intermediate', viralScore: 86
    },
    {
      title: '동반 식당을 위한 반려동물 전용 체어 "초코린"',
      description: '반려동물이 사람과 눈높이를 맞추고 안전하게 앉을 수 있는 식당/카페 전용 의자 크라우드 펀딩 돌풍.',
      tags: ['펫가구', '펫체어', '아이디어상품', '펀딩'], animal: 'both', difficulty: 'basic', viralScore: 80
    }
  ]
};

let c = 0;
for (const sub of trendCat.subcategories) {
  if (trends[sub.id]) {
    sub.topics = trends[sub.id];
    c += sub.topics.length;
  }
}

let total = 0;
db.categories.forEach(cat => cat.subcategories.forEach(s => total += s.topics.length));
db.metadata.totalTopics = total;
db.metadata.lastUpdated = new Date().toISOString();

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
console.log(`Successfully updated ${c} trend topics based on latest news. Total topics now ${total}.`);
