const fs = require('fs');
const path = require('path');

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickTags = (tags, count) => {
  const shuffled = [...tags].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const difficulties = ['basic', 'intermediate', 'advanced'];
const animals = ['dog', 'cat', 'both'];

function generateTopics(subcat, count) {
  const topics = [];
  const usedTitles = new Set();
  
  for (let i = 0; i < count; i++) {
    let title, desc;
    let attempts = 0;
    do {
      const template = pick(subcat.templates);
      title = template.t.replace('{a}', pick(subcat.nouns)).replace('{b}', pick(subcat.actions));
      desc = template.d.replace('{a}', pick(subcat.nouns)).replace('{b}', pick(subcat.actions));
      attempts++;
    } while (usedTitles.has(title) && attempts < 100);
    
    usedTitles.add(title);
    topics.push({
      title: title,
      description: desc + ' ' + pick(['필독 가이드입니다.', '보호자가 반드시 알아야 할 내용입니다.', '수의학적 관점에서 분석합니다.', '실생활 적용 팁을 포함합니다.']),
      tags: pickTags(subcat.tags, randInt(2, 4)),
      animal: pick(animals),
      difficulty: pick(difficulties),
      viralScore: randInt(60, 98)
    });
  }
  return topics;
}

const vetData = {
  id: 'veterinary', name: '수의학',
  subcategories: [
    {
      id: 'vet-nutrition', name: '영양학', icon: '🥗',
      tags: ['영양소', '단백질', '비타민', '미네랄', '사료성분', '건강식', '보충제'],
      nouns: ['단백질', '오메가3', '칼슘', '유산균', '비타민', '탄수화물', '타우린', '식이섬유'],
      actions: ['균형', '과잉섭취', '결핍증상', '적정량', '흡수율', '소화율'],
      templates: [
        { t: '반려동물 {a}의 완벽한 {b} 가이드', d: '{a}의 중요성과 {b}에 대해 알아봅니다.' },
        { t: '{a} {b} 문제, 어떻게 해결할까?', d: '{a}의 {b} 시 발생할 수 있는 질환과 예방법.' },
        { t: '사료 속 {a}, {b}을 높이는 비법', d: '매일 먹는 사료에서 {a}의 {b}을 최적화하는 방법.' },
        { t: '{a}의 진실: {b}의 오해와 팩트체크', d: '{a}에 대한 잘못된 상식과 올바른 {b} 지식.' }
      ]
    },
    {
      id: 'vet-feed', name: '사료학', icon: '🍖',
      tags: ['사료등급', '그레인프리', '원료분석', '습식사료', '처방사료', '급여량', '보관법'],
      nouns: ['육분', '곡물', '방부제', '단백질원', '인공첨가물', '수분함량'],
      actions: ['분석법', '라벨읽기', '주의사항', '비교검증', '선택기준'],
      templates: [
        { t: '사료 라벨 속 {a} {b} 완벽 정리', d: '숨겨진 {a} 성분과 올바른 {b}을 배웁니다.' },
        { t: '{a} 없는 사료, 올바른 {b}', d: '{a} 무첨가 사료의 장단점과 {b}.' },
        { t: '프리미엄 사료의 {a} {b} 팩트체크', d: '값비싼 사료의 {a}에 대한 {b} 가이드.' },
        { t: '내 아이에게 맞는 {a} {b}', d: '맞춤형 사료 선택을 위한 {a} {b} 노하우.' }
      ]
    },
    {
      id: 'vet-disease', name: '질병백과', icon: '🏥',
      tags: ['슬개골', '신장병', '당뇨', '췌장염', '심장병', '아토피', '호흡기'],
      nouns: ['슬개골 탈구', '만성 신부전', '당뇨병', '췌장염', '심장사상충', '아토피 피부염', '종양', '결석'],
      actions: ['초기증상', '치료법', '예방가이드', '수술시기', '관리방법'],
      templates: [
        { t: '{a}의 모든 것: {b}부터 완치까지', d: '{a}의 치명적인 위험성과 {b} 총정리.' },
        { t: '방치하면 위험한 {a} {b}', d: '조기 발견이 필수인 {a}의 {b} 알아보기.' },
        { t: '{a} 진단 후 필수 {b}', d: '{a} 확진 시 보호자가 취해야 할 {b}.' },
        { t: '수의사가 말하는 {a} {b}', d: '임상 경험을 바탕으로 한 {a} {b} 조언.' }
      ]
    },
    {
      id: 'vet-prescription', name: '처방식/치료식', icon: '💊',
      tags: ['처방식', '신장사료', '당뇨사료', '간식제한', '위장관', '다이어트', '가수분해'],
      nouns: ['신장 질환', '간 질환', '요로결석', '당뇨', '비만', '알레르기', '심장 질환'],
      actions: ['처방식 가이드', '식이요법', '사료 전환법', '성분 분석', '급여 주의점'],
      templates: [
        { t: '{a} 맞춤형 {b}', d: '{a} 관리를 위한 필수 {b}.' },
        { t: '{a} 환자를 위한 {b} 꿀팁', d: '{a} 회복을 돕는 {b} 및 영양 관리.' },
        { t: '{a} 처방사료 100% 활용하는 {b}', d: '{a} 처방식의 원리와 {b} 상세 분석.' },
        { t: '{a} 극복을 위한 {b}', d: '{a} 진단 동물을 위한 철저한 {b}.' }
      ]
    },
    {
      id: 'vet-prevention', name: '예방의학', icon: '🛡️',
      tags: ['건강검진', '예방접종', '심장사상충', '외부기생충', '중성화', '산책안전', '비만예방'],
      nouns: ['종합백신', '구충제', '정기 건강검진', '마이크로칩', '중성화 수술', '진드기 예방'],
      actions: ['접종 시기', '부작용 관리', '연령별 스케줄', '필수 체크리스트', '비용 대비 효과'],
      templates: [
        { t: '반려동물 {a}의 올바른 {b}', d: '{a}의 중요성과 {b}에 대한 완벽 안내서.' },
        { t: '{a} 전 알아야 할 {b}', d: '{a} 진행 시 발생할 수 있는 문제와 {b}.' },
        { t: '수의사가 권장하는 {a} {b}', d: '안전한 {a}를 위한 전문가의 {b}.' },
        { t: '{a} 오해와 진실: {b} 파헤치기', d: '{a}에 얽힌 소문과 올바른 {b}.' }
      ]
    },
    {
      id: 'vet-dental', name: '치과', icon: '🦷',
      tags: ['치석', '양치질', '스케일링', '구취', '치주염', '발치', '덴탈간식'],
      nouns: ['치석', '치은염', '유치 잔존', '구취', '치아 흡수 병변', '치과 엑스레이'],
      actions: ['제거법', '예방 루틴', '스케일링 필요성', '홈케어법', '조기 발견법'],
      templates: [
        { t: '{a} 안녕! 완벽한 {b}', d: '{a}로 인한 통증 예방과 {b}.' },
        { t: '위험한 {a}, 안전한 {b}', d: '{a} 방치 시 생기는 전신 질환과 {b}.' },
        { t: '{a} 막는 1일 1회 {b}', d: '{a} 방지를 위한 가장 효과적인 {b}.' },
        { t: '나이 들수록 중요한 {a} {b}', d: '노령 동물의 {a} 관리와 {b} 꿀팁.' }
      ]
    },
    {
      id: 'vet-emergency', name: '응급의학', icon: '🚑',
      tags: ['골든타임', 'CPR', '이물섭취', '응급처치', '독극물', '교통사고', '경련'],
      nouns: ['포도 섭취', '초콜릿 중독', '심정지', '급성 구토', '호흡 곤란', '골절'],
      actions: ['응급 처치법', '골든타임 확보', '병원 이송 팁', 'CPR 방법', '대처 매뉴얼'],
      templates: [
        { t: '{a} 사고 발생 시 {b}', d: '{a} 응급 상황 시 보호자의 1순위 {b}.' },
        { t: '집에서 할 수 있는 {a} {b}', d: '{a} 발생 직후 집에서 해야 할 {b}.' },
        { t: '생명을 구하는 {a} {b}', d: '{a} 시 절대 당황하지 않는 {b}.' },
        { t: '{a} 의심될 때의 {b}', d: '{a} 의심 증상 5가지와 {b}.' }
      ]
    },
    {
      id: 'vet-senior', name: '노령동물학', icon: '👴',
      tags: ['치매', '관절염', '호스피스', '면역력', '노령견', '노령묘', '영양제'],
      nouns: ['치매(인지기능장애)', '근감소증', '만성 관절염', '백내장', '면역 저하', '청력 손실'],
      actions: ['케어법', '영양 보충', '환경 개선', '통증 관리', '수명 연장 팁'],
      templates: [
        { t: '노령기 {a} 예방을 위한 {b}', d: '{a} 진행을 늦추는 {b} 및 홈케어.' },
        { t: '나이 든 아이의 {a} {b}', d: '{a} 극복을 위한 영양 설계와 {b}.' },
        { t: '{a} 환자를 편안하게 하는 {b}', d: '{a} 진단 후 삶의 질을 높이는 {b}.' },
        { t: '시니어 펫 {a} {b} 완벽 분석', d: '{a}의 세부 증상과 실질적 {b}.' }
      ]
    },
    {
      id: 'vet-dermatology', name: '피부과', icon: '🩹',
      tags: ['알레르기', '아토피', '탈모', '곰팡이', '약용샴푸', '각질', '피부염'],
      nouns: ['아토피', '식이 알레르기', '말라세지아', '피부사상균', '핫스팟', '탈모증'],
      actions: ['원인 분석', '치료약물', '목욕 관리법', '식이요법', '증상 완화법'],
      templates: [
        { t: '지독한 가려움증! {a} {b}', d: '{a}의 근본 원인 파악과 {b}.' },
        { t: '{a} 재발을 막는 {b}', d: '만성 {a} 관리를 위한 홈 {b}.' },
        { t: '{a}의 오해와 {b}', d: '{a}에 대한 잘못된 치료 상식과 {b}.' },
        { t: '약용 샴푸로 {a} {b}', d: '{a} 완화를 위한 올바른 샴푸 선택과 {b}.' }
      ]
    },
    {
      id: 'vet-homecare', name: '안과/홈케어', icon: '👁️',
      tags: ['눈물자국', '각막궤양', '안구건조', '투약법', '소독', '발톱관리', '귀세정'],
      nouns: ['눈물자국', '각막 상처', '안구 건조증', '귀지', '상처 감염', '발톱'],
      actions: ['제거법', '소독법', '점안액 넣기', '관리법', '통증 감소 팁'],
      templates: [
        { t: '{a} 완벽 해결을 위한 {b}', d: '골칫거리 {a}를 홈케어로 해결하는 {b}.' },
        { t: '올바른 {a} {b} 가이드', d: '{a} 시 동물병원 가지 않고도 할 수 있는 {b}.' },
        { t: '{a} 악화를 막는 {b}', d: '초기 {a} 관리에 필수적인 {b}.' },
        { t: '수의사가 알려주는 {a} {b}', d: '프로페셔널한 {a} {b} 노하우 대공개.' }
      ]
    }
  ]
};

const behData = {
  id: 'behavior', name: '행동분석학',
  subcategories: [
    {
      id: 'beh-psychology', name: '행동심리', icon: '🧠',
      tags: ['스트레스', '카밍시그널', '분리불안', '행동교정', '고양이언어'],
      nouns: ['분리불안', '배 보이기', '꼬리 언어', '애착 관계', '학습된 무기력'],
      actions: ['심리 분석', '진짜 의미', '스트레스 해소법', '교정법'],
      templates: [
        { t: '반려동물의 {a}: 그 {b}을 파헤치다', d: '{a} 행동의 기저 심리와 {b}.' },
        { t: '{a}을 보이는 심리와 {b}', d: '보호자가 오해하기 쉬운 {a}의 {b}.' }
      ]
    },
    {
      id: 'beh-training', name: '훈련/교육', icon: '🎓',
      tags: ['클리커', '배변훈련', '산책훈련', '사회화', '보상'],
      nouns: ['산책 줄당김', '배변 훈련', '리콜 훈련', '사회화 훈련', '클리커 훈련'],
      actions: ['성공 법칙', '기본 원칙', '실패 원인', '단계별 가이드'],
      templates: [
        { t: '{a} 마스터하기: {b}', d: '{a}의 핵심 팁과 {b} 총정리.' },
        { t: '{a}에 실패하는 사람들의 {b}', d: '{a} 훈련 교정을 위한 {b}.' }
      ]
    },
    {
      id: 'beh-body', name: '신체언어', icon: '🐾',
      tags: ['신체언어', '꼬리', '귀', '동공', '카밍시그널'],
      nouns: ['스트레스 신호', '플레이 바우', '귀 위치', '동공 크기', '자세'],
      actions: ['감정 읽기', '해독법', '숨은 의미 파악'],
      templates: [
        { t: '{a}로 알아보는 {b}', d: '{a}를 통해 아이들의 마음을 {b}.' },
        { t: '{a}의 미세한 변화와 {b}', d: '{a}에 담긴 복잡한 감정과 {b}.' }
      ]
    },
    {
      id: 'beh-problem', name: '문제행동', icon: '⚠️',
      tags: ['공격성', '짖음', '마운팅', '배변실수', '물기'],
      nouns: ['과도한 짖음', '공격성', '소변 스프레이', '자해 행동', '물어뜯기'],
      actions: ['해결책', '원인 분석', '교정 스케줄', '예방법'],
      templates: [
        { t: '{a}의 근본 원인과 {b}', d: '골치 아픈 {a} 문제에 대한 {b}.' },
        { t: '{a} 절대 방치하지 마세요: {b}', d: '{a} 교정의 골든타임과 {b}.' }
      ]
    },
    {
      id: 'beh-environment', name: '환경관리', icon: '🏠',
      tags: ['환경풍부화', '수직공간', '다묘가정', '페로몬', '스트레스'],
      nouns: ['수직 공간', '화장실 위치', '다묘 가정 갈등', '환경 풍부화', '안전 영역'],
      actions: ['배치법', '조성 팁', '최적화 가이드', '스트레스 감소법'],
      templates: [
        { t: '{a} 구성을 위한 {b}', d: '집안 환경 개선을 통한 {a} {b}.' },
        { t: '{a} 관리가 곧 건강: {b}', d: '{a}와 반려동물 복지를 위한 {b}.' }
      ]
    },
    {
      id: 'beh-stress', name: '스트레스/정서', icon: '😌',
      tags: ['우울증', '트라우마', '사회화', '분리스트레스', '진정'],
      nouns: ['소음 공포', '이사 스트레스', '차멀미', '펫로스 증후군', '만성 불안'],
      actions: ['극복 가이드', '완화법', '마인드 케어', '행동 약물 요법'],
      templates: [
        { t: '{a}로 힘든 아이를 위한 {b}', d: '{a} 해소를 위한 전문가의 {b}.' },
        { t: '{a} 징후 감지와 {b}', d: '{a} 극복을 돕는 따뜻한 {b}.' }
      ]
    },
    {
      id: 'beh-cat', name: '고양이전문', icon: '🐱',
      tags: ['고양이', '스크래칭', '사냥놀이', '캣닢', '야간광란'],
      nouns: ['우다다(야간광란)', '사냥 본능', '스크래칭 본능', '화장실 거부', '합사'],
      actions: ['이해하기', '문제 해결법', '단계별 적응', '환경 세팅'],
      templates: [
        { t: '고양이의 {a}: {b} 가이드', d: '반려묘의 독특한 {a}와 완벽한 {b}.' },
        { t: '{a}에 대처하는 집사의 {b}', d: '고양이 {a} 문제 예방 및 {b}.' }
      ]
    },
    {
      id: 'beh-dog', name: '강아지전문', icon: '🐕',
      tags: ['강아지', '사회화', '퍼피', '놀이', '에너지'],
      nouns: ['퍼피 사회화', '입질(무는 행동)', '품종별 특성', '에너지 발산', '보호소 입양'],
      actions: ['훈련 팁', '골든타임 활용법', '맞춤형 산책법', '초기 적응법'],
      templates: [
        { t: '반려견 {a} 성공적인 {b}', d: '견종 특성에 맞는 {a}와 {b}.' },
        { t: '{a} 시기 필수 {b}', d: '건강한 성견으로 자라기 위한 {a} {b}.' }
      ]
    }
  ]
};

const finalData = {
  categories: [],
  metadata: {
    totalTopics: 500,
    lastUpdated: new Date().toISOString(),
    version: "2.0"
  }
};

const vetCat = { id: vetData.id, name: vetData.name, subcategories: [] };
for (const sub of vetData.subcategories) {
  const topics = generateTopics(sub, 30);
  vetCat.subcategories.push({
    id: sub.id, name: sub.name, icon: sub.icon, topics
  });
}
finalData.categories.push(vetCat);

const behCat = { id: behData.id, name: behData.name, subcategories: [] };
for (const sub of behData.subcategories) {
  const topics = generateTopics(sub, 25);
  behCat.subcategories.push({
    id: sub.id, name: sub.name, icon: sub.icon, topics
  });
}
finalData.categories.push(behCat);

// Keep existing trends if possible
try {
  const existingPath = path.join(__dirname, 'data', 'content-db.json');
  if (fs.existsSync(existingPath)) {
    const existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
    const trends = existing.categories.find(c => c.id === 'trends');
    if (trends) {
      finalData.categories.push(trends);
      let count = 0;
      trends.subcategories.forEach(s => count += s.topics.length);
      finalData.metadata.totalTopics = 300 + 200 + count;
    }
  }
} catch (e) {
  console.log("Failed to load existing trends", e);
}

fs.writeFileSync(path.join(__dirname, 'data', 'content-db.json'), JSON.stringify(finalData, null, 2));
console.log(`Generated exactly 300 vet and 200 behavior topics! Saved to content-db.json.`);
