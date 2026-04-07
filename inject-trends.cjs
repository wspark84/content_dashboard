/**
 * 트렌드 데이터 주입 — Brave Search API 결과를 content-db.json에 추가
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'content-db.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

const today = new Date().toISOString().split('T')[0];

// 트렌드 카테고리 확인/생성
let trendCat = db.categories.find(c => c.id === 'trend');
if (!trendCat) {
  trendCat = {
    id: 'trend', name: '트렌드분석', icon: '📈',
    subcategories: [
      { id: 'trend-news', name: '업계 뉴스', icon: '📰', topics: [] },
      { id: 'trend-issue', name: '이슈/논란', icon: '🚨', topics: [] },
      { id: 'trend-product', name: '제품/서비스', icon: '🆕', topics: [] }
    ]
  };
  db.categories.push(trendCat);
} else {
  // 기존 서브카테고리 초기화 (최신 데이터로 교체)
  for (const sub of trendCat.subcategories) sub.topics = [];
}

const trends = {
  'trend-news': [
    {
      id: 'tn001', title: '3월 1일부터 반려동물 동반 음식점 출입 허용 — 식품위생법 개정',
      description: '20년 묵은 규제가 풀렸다. 식품위생법 시행규칙 개정으로 위생·안전기준을 갖춘 식당에서 반려동물(개·고양이) 동반 출입이 공식 허용. 반려동물 산업 확대의 전환점이라는 평가.',
      tags: ['정책변화', '식품위생법', '펫프렌들리', '외식산업'], animal: 'both', difficulty: 'basic', viralScore: 97, source: '매일경제', crawledAt: today
    },
    {
      id: 'tn002', title: '"노펫존" 선언하는 카페·식당들 — 반려동물 허용 반대 움직임도',
      description: '반려동물 동반 출입 허용 후 오히려 "노펫존"을 선언하는 업소가 늘고 있다. 비반려인들의 위생·안전 우려와 반려인들의 요구 사이에서 갈등이 심화되는 중.',
      tags: ['노펫존', '갈등', '펫프렌들리', '자영업자'], animal: 'both', difficulty: 'basic', viralScore: 95, source: '매일경제', crawledAt: today
    },
    {
      id: 'tn003', title: '98개 동물단체, 반려동물 부처 이관 촉구 — "가축인가 가족인가"',
      description: '농림축산식품부에서 반려동물 정책을 분리하여 독립 부처로 이관해야 한다는 목소리. 동물복지를 독립 정책 영역으로 격상하자는 취지. 법률 개정·예산 재배치 등 종합 설계 필요.',
      tags: ['동물복지', '부처이관', '정책', '동물단체'], animal: 'both', difficulty: 'intermediate', viralScore: 88, source: '한국NGO신문', crawledAt: today
    },
    {
      id: 'tn004', title: '국무2차장 주재 반려동물 정책 간담회 — 정부 차원 현안 논의',
      description: '국무조정실이 반려동물 관련 협회·단체, 전문가와 함께 정책 간담회 개최. 반려동물 주무부처 현안 논의 및 다양한 의견 경청.',
      tags: ['국무조정실', '정책간담회', '동물복지', '정부정책'], animal: 'both', difficulty: 'basic', viralScore: 82, source: '정책브리핑', crawledAt: today
    },
    {
      id: 'tn005', title: '부정확한 동물등록률 — 정부 조사에서도 차이 확인',
      description: '동물복지국민의식조사와 2025 반려동물 양육현황조사 간 등록률 차이(69.8%)가 확인. 정부 스스로 기존 조사의 부정확성을 입증한 셈.',
      tags: ['동물등록', '등록률', '통계', '정책과제'], animal: 'both', difficulty: 'intermediate', viralScore: 79, source: '데일리벳', crawledAt: today
    },
    {
      id: 'tn006', title: '서울시 동물병원 진료비 지원 — 2026년 3월~12월',
      description: '서울시가 동물등록된 반려견·반려묘 대상 동물병원 진료비 지원 사업 시행. 예산 소진 시 조기 마감.',
      tags: ['서울시', '진료비지원', '동물등록', '의료비'], animal: 'both', difficulty: 'basic', viralScore: 91, source: '서울시', crawledAt: today
    },
    {
      id: 'tn007', title: '2026 펫 휴머니제이션 — 반려동물이 가족 구성원으로 편입',
      description: '반려견이 가족 구성원으로 완벽히 편입된 Pet Humanization 흐름이 2026년 한국의 문화 지형도를 전면 재편하고 있다는 분석.',
      tags: ['펫휴머니제이션', '문화변화', '가족', '트렌드'], animal: 'both', difficulty: 'basic', viralScore: 86, source: '솔루션뉴스', crawledAt: today
    },
    {
      id: 'tn008', title: '보람그룹, 반려동물 동반 여행상품 론칭 — 펫상조 라인업 강화',
      description: '보람그룹이 펫츠고트래블과 MOU 체결. 반려동물 동반 전문여행 문화 확산과 제휴상품 개발에 나섬.',
      tags: ['펫여행', '펫상조', '여행상품', 'MOU'], animal: 'both', difficulty: 'basic', viralScore: 75, source: '더구루', crawledAt: today
    }
  ],
  'trend-issue': [
    {
      id: 'ti001', title: '"예방접종 증명하라니" — 반려동물 식당 진입장벽 논란',
      description: '반려동물 동반 출입 허용되었지만 실제로는 예방접종 증명, 케이지 필수 등 까다로운 조건에 반려인들의 불만 폭발. 제도의 실효성 문제 제기.',
      tags: ['예방접종', '식당출입', '규제', '실효성'], animal: 'both', difficulty: 'basic', viralScore: 94, source: '매일경제', crawledAt: today
    },
    {
      id: 'ti002', title: '동물 유래 사료원료 관리체계 공백 논란 — ASF 감염 위험',
      description: 'ASF 확진 양돈장 사례 이후 돼지 혈액 기반 사료원료의 안전성 관리 공백이 지적됨. 현행 제도 하에서 오염 사료가 자유롭게 유통될 수 있다는 경고.',
      tags: ['사료안전', 'ASF', '관리공백', '축산'], animal: 'dog', difficulty: 'advanced', viralScore: 90, source: '축산신문', crawledAt: today
    },
    {
      id: 'ti003', title: '슬기로운 맹견 반려생활 — 농식품부 캠페인 시작',
      description: '농림축산식품부 동물복지정책국이 맹견 안전 관리 캠페인 실시. 맹견 보호자의 책임감과 안전 수칙 강조.',
      tags: ['맹견', '안전관리', '캠페인', '농식품부'], animal: 'dog', difficulty: 'basic', viralScore: 85, source: '다자비', crawledAt: today
    },
    {
      id: 'ti004', title: '강아지 토하는 이유 5가지 — 장폐색 위험 신호 총정리',
      description: '장난감 조각, 포도, 초콜릿 등 이물질 섭취 시 구토 반응. 반복 구토+기력 저하 시 장폐색 의심, 즉시 동물병원 방문 필요.',
      tags: ['구토', '장폐색', '응급', '건강'], animal: 'dog', difficulty: 'basic', viralScore: 88, source: '애니멀플래닛', crawledAt: today
    },
    {
      id: 'ti005', title: '반려동물 초콜릿 중독 — 메틸잔틴 독성 계산기 등장',
      description: '초콜릿 종류별 테오브로민 함량과 체중 대비 독성 용량을 계산하는 온라인 도구. 20mg/kg 가벼운 독성, 60mg/kg 발작 위험, 100mg/kg 치사량.',
      tags: ['초콜릿중독', '독성', '응급', '계산기'], animal: 'dog', difficulty: 'intermediate', viralScore: 83, source: 'miniwebtool', crawledAt: today
    }
  ],
  'trend-product': [
    {
      id: 'tp001', title: '오사카발 "초코린" 펫 체어 — 반려동물 식탁 동반 신제품',
      description: '반려동물과 눈높이를 맞춰 함께 식사할 수 있는 전용 펫 체어. 2026년 3월 예약 시작, 7월 발송 예정. 새로운 반려동물 식사 문화 선도.',
      tags: ['신제품', '펫체어', '펫가구', '크라우드펀딩'], animal: 'both', difficulty: 'basic', viralScore: 78, source: '야호펫', crawledAt: today
    },
    {
      id: 'tp002', title: '2026 강아지 사료 성분 완전정복 — 조단백·조지방 숫자의 진실',
      description: '사료 라벨의 조단백·조지방 수치만으로는 품질을 판단할 수 없다. 성분표 뒤에 숨겨진 원재료 함정과 올바른 해석법 가이드.',
      tags: ['사료성분', '라벨읽기', '조단백', '조지방'], animal: 'dog', difficulty: 'intermediate', viralScore: 84, source: '하콩달콩', crawledAt: today
    },
    {
      id: 'tp003', title: '비건 강아지 사료 브랜드 비교 — 영양 적합성 기준 체크포인트',
      description: '해외 비건 사료 브랜드의 필수 아미노산 보강, 칼로리·단백·지방 범위, 리콜 이력 등을 비교 분석. 채식 사료 선택 시 핵심 체크포인트.',
      tags: ['비건사료', '브랜드비교', '영양적합성', '리콜이력'], animal: 'dog', difficulty: 'advanced', viralScore: 76, source: '비건뉴스', crawledAt: today
    },
    {
      id: 'tp004', title: '사료 등급표로 알아보는 반려견 건강관리 — 등급별 특징과 선택법',
      description: '홀리스틱·슈퍼프리미엄·프리미엄·일반 등급별 사료의 원재료 구성, 가격대, 적합한 상황을 정리한 실용 가이드.',
      tags: ['사료등급', '건강관리', '선택가이드', '품질'], animal: 'dog', difficulty: 'basic', viralScore: 80, source: 'talklog', crawledAt: today
    }
  ]
};

// 주입
for (const [subId, topics] of Object.entries(trends)) {
  const sub = trendCat.subcategories.find(s => s.id === subId);
  if (sub) sub.topics = topics;
}

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');

// 통계 출력
let total = 0;
for (const sub of trendCat.subcategories) {
  console.log(`${sub.icon} ${sub.name}: ${sub.topics.length}건`);
  total += sub.topics.length;
}
console.log(`\n✅ 트렌드 ${total}건 추가 완료!`);
