const fs = require('fs');
const path = require('path');
const existingDbPath = path.join(__dirname, 'data/content-db.json');

let trendsData = [];
const existing = JSON.parse(fs.readFileSync(existingDbPath, 'utf8'));
const realTrendCat = existing.categories.find(c => c.id === 'trend');
if (realTrendCat && realTrendCat.subcategories) {
    trendsData = realTrendCat.subcategories;
}

// Word banks
const prefixes = ["알아두면 좋은", "꼭 알아야 할", "수의사가 말하는", "초보자를 위한", "전문가 칼럼:", "심화 가이드:", "오해와 진실:", "최신 연구:", "가정에서 할 수 있는", "실전!"];
const suffixes = ["관리법", "예방법", "핵심 체크포인트", "A to Z", "완벽 정리", "대처법", "이해하기", "올바른 접근", "상세 가이드", "실용 팁"];

const keywords = {
    "vet-nutrition": ["강아지 사료 성분", "고양이 습식사료", "생식과 화식", "비만견 다이어트", "퍼피 영양학", "노령견 보조제", "단백질 알러지", "수분 섭취량", "처방식 급여", "오메가3 효능", "비타민 보충", "유산균 선택"],
    "vet-feed": ["사료 성분표 읽기", "그레인프리 사료", "건사료 보관법", "고양이 사료 기호성", "AAFCO 기준", "사료 등급제", "곤충 단백질 사료", "강아지 수제간식", "가수분해 사료", "연령별 사료 교체", "동결건조 사료", "다이어트 사료"],
    "vet-disease": ["슬개골 탈구", "고양이 신부전", "심장사상충", "파보 바이러스", "고양이 전염성 복막염(FIP)", "기관지 협착증", "강아지 쿠싱증후군", "고양이 당뇨", "강아지 백내장", "고양이 하부요로기 질환(FLUTD)", "췌장염", "디스크(IVDD)"],
    "vet-prescription": ["신장 보조 처방식", "간질환 처방식", "결석 용해 처방식", "다이어트 처방식", "소화기 처방식", "심장병 처방식", "알러지 처방식", "당뇨 처방식", "처방식 급여 시기", "처방식 부작용 관리", "관절 처방식", "치과 처방식"],
    "vet-preventive": ["종합 백신 접종", "광견병 예방", "외부 기생충 구충", "내부 기생충 관리", "건강검진 주기", "중성화 수술 시기", "마이크로칩 등록", "유전자 검사", "항체 역가 검사", "스트레스 예방", "치석 예방", "비만 예방"],
    "vet-dental": ["강아지 양치질", "고양이 치아흡수성병변(FORL)", "스케일링 주기", "치주염 관리", "유치 발치", "구취 원인", "치과 전용 간식", "무마취 스케일링", "구내염 치료", "치석 예방 장난감", "부정교합", "양치질 훈련"],
    "vet-emergency": ["초콜릿 중독", "포도 섭취 응급처치", "자일리톨 중독", "이물질 삼킴", "열사병 대처", "강아지 경련/발작", "벌 쏘임 알러지", "교통사고 응급조치", "심폐소생술(CPR)", "기도 폐쇄 대처", "화상 응급처치", "출혈 지혈법"],
    "vet-geriatric": ["노령견 치매(인지장애)", "노령묘 관절염", "시니어 사료 전환", "노령견 백내장", "노령 동물 호스피스", "시니어 건강검진", "노령묘 신부전", "노령견 심장병", "근육량 감소 예방", "노령 동물 환경 개선", "시니어 영양제", "노령견 산책법"],
    "vet-dermatology": ["강아지 아토피", "고양이 링웜", "농피증 치료", "모낭충 감염", "말라세지아 피부염", "식이 알러지 피부염", "발바닥 습진", "강아지 귓병(외이염)", "고양이 턱드름", "피부 보습 관리", "알러지 검사", "약용 샴푸 사용법"],
    "vet-ophthalmology": ["강아지 백내장", "고양이 허피스 결막염", "각막 궤양", "녹내장 예방", "체리아이 수술", "건성각결막염(안구건조증)", "포도막염 치료", "유루증(눈물자국)", "노령견 핵경화증", "안과 정기검진", "각막 스크래치", "눈 세정제 사용법"],
    "beh-psychology": ["분리불안 심리", "강아지 카밍시그널", "고양이 애정표현", "반려동물 우울증", "파괴행동 심리", "강박행동 원인", "강아지 질투심", "고양이 영역본능", "소음 공포증", "학습된 무기력", "강아지 인지능력", "동물 행동발달"],
    "beh-training": ["클리커 트레이닝", "배변 훈련", "크레이트 훈련", "기본 예절 교육", "산책 훈련(줄 당기지 않기)", "사회화 훈련", "개인기 훈련", "퍼피 트레이닝", "입질 교정", "콜백(부르기) 훈련", "무는 버릇 교정", "타겟 트레이닝"],
    "beh-bodylanguage": ["꼬리 언어", "귀 움직임 의미", "강아지 하품", "고양이 채터링", "기지개 켜는 이유", "강아지 헥헥거림", "고양이 꾹꾹이", "배를 보이는 행동", "눈맞춤의 의미", "고양이 골골송", "강아지 기지개", "몸 털기 의미"],
    "beh-problem": ["분리불안 교정", "공격성 통제", "헛짖음 교정", "식분증(똥 먹는 행동)", "마킹(영역표시) 문제", "물건 집착", "손/발 깨무는 버릇", "고양이 화장실 실수", "동종 간 공격성", "낯선 사람 경계", "음식 방어성", "산책 시 짖음"],
    "beh-environment": ["다견 가정 합사", "다묘 가정 화장실", "수직 공간(캣타워)", "실내 미끄럼 방지", "안전한 펜스 설치", "강아지 방석/집 위치", "노즈워크 환경", "고양이 스크래쳐 배치", "스트레스 없는 소음 관리", "혼자 있는 시간 환경", "풍부화 장난감", "환기 및 온도 조절"],
    "beh-stress": ["이사 스트레스", "동물병원 방문 스트레스", "천둥/불꽃놀이 공포", "목욕 스트레스", "미용 스트레스", "새로운 가족 맞이", "주인 부재 스트레스", "산책 시 긴장감", "다묘 가정 서열 스트레스", "합사 스트레스 완화", "외로움 해소", "차량 탑승 스트레스"],
    "beh-cat": ["고양이 모래 선택", "스크래칭 이유", "수분 섭취 유도", "캣닢/마타타비 반응", "고양이 야간 우다다", "사냥 놀이 방법", "고양이 하악질", "캣휠 활용법", "그루밍 행동 분석", "고양이 숨는 이유", "다묘 가정 서열", "창밖 구경 의미"],
    "beh-dog": ["퍼피 사회화 시기", "강아지 노즈워크", "견종별 성향 차이", "터그 놀이 규칙", "공놀이 집착", "강아지 마운팅", "산책 중 냄새 맡기", "강아지 땅 파는 행동", "다른 개와의 인사법", "보호자 방어 본능", "터치 적응 훈련", "마킹 심리"]
};

const vetCats = [
    { id: "vet-nutrition", name: "영양학", icon: "🥗" },
    { id: "vet-feed", name: "사료학", icon: "🍖" },
    { id: "vet-disease", name: "질병백과", icon: "🏥" },
    { id: "vet-prescription", name: "처방식/치료식", icon: "💊" },
    { id: "vet-preventive", name: "예방의학", icon: "🛡️" },
    { id: "vet-dental", name: "치과", icon: "🦷" },
    { id: "vet-emergency", name: "응급의학", icon: "🚑" },
    { id: "vet-geriatric", name: "노령동물학", icon: "👴" },
    { id: "vet-dermatology", name: "피부과", icon: "🩹" },
    { id: "vet-ophthalmology", name: "안과/기타", icon: "👁️" }
];

const behCats = [
    { id: "beh-psychology", name: "행동심리", icon: "🧠" },
    { id: "beh-training", name: "훈련/교육", icon: "🎓" },
    { id: "beh-bodylanguage", name: "신체언어", icon: "🐾" },
    { id: "beh-problem", name: "문제행동", icon: "⚠️" },
    { id: "beh-environment", name: "환경관리", icon: "🏠" },
    { id: "beh-stress", name: "스트레스/정서", icon: "😌" },
    { id: "beh-cat", name: "고양이전문", icon: "🐱" },
    { id: "beh-dog", name: "강아지전문", icon: "🐕" }
];

function generateTopicsList(subcatId, count, categoryName, subcategoryName) {
    const topics = [];
    const kws = keywords[subcatId] || ["건강 관리", "행동 교정"];
    const usedTitles = new Set();
    let k = 0;
    while(topics.length < count) {
        const kw = kws[k % kws.length];
        const pref = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suff = suffixes[Math.floor(Math.random() * suffixes.length)];
        let title = `${pref} ${kw} ${suff}`;
        if (usedTitles.has(title)) { k++; continue; }
        usedTitles.add(title);
        const desc = `반려동물의 올바른 ${subcategoryName} 및 ${kw}에 대해 자세히 알아봅니다. 실생활에서 활용 가능한 전문적이고 유용한 정보를 제공하여 반려동물의 건강과 행복을 증진시킵니다.`;
        let an = "both";
        if (subcatId === 'beh-cat' || kw.includes('고양이') || kw.includes('묘')) an = 'cat';
        else if (subcatId === 'beh-dog' || kw.includes('강아지') || kw.includes('견') || kw.includes('퍼피')) an = 'dog';
        else {
            const r = Math.random();
            if(r < 0.3) an = 'dog';
            else if(r < 0.6) an = 'cat';
            else an = 'both';
        }
        topics.push({
            id: `${subcatId}-t${topics.length + 1}`,
            title: title,
            description: desc,
            tags: [categoryName, subcategoryName, kw.split(' ')[0]],
            animal: an,
            difficulty: ["basic", "intermediate", "advanced"][Math.floor(Math.random() * 3)],
            viralScore: Math.floor(Math.random() * 39) + 60
        });
        k++;
    }
    return topics;
}

const finalData = {
    categories: [
        {
            id: "veterinary",
            name: "수의학",
            subcategories: vetCats.map(c => ({
                id: c.id,
                name: c.name,
                icon: c.icon,
                topics: generateTopicsList(c.id, 30, "수의학", c.name)
            }))
        },
        {
            id: "behavior",
            name: "행동분석학",
            subcategories: behCats.map(c => ({
                id: c.id,
                name: c.name,
                icon: c.icon,
                topics: generateTopicsList(c.id, 25, "행동분석학", c.name)
            }))
        },
        {
            id: "trends",
            name: "트렌드분석",
            subcategories: trendsData
        }
    ],
    metadata: {
        totalTopics: 0,
        lastUpdated: new Date().toISOString(),
        version: "2.0"
    }
};

let total = 0;
finalData.categories.forEach(c => {
    c.subcategories.forEach(sc => total += sc.topics.length);
});
finalData.metadata.totalTopics = total;

fs.writeFileSync(existingDbPath, JSON.stringify(finalData, null, 2), 'utf8');
console.log(`Generated db with ${total} topics successfully.`);
