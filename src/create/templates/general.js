// 일반글 템플릿
import { CTA_FIXED } from './expert.js';

export { CTA_FIXED };

/**
 * 일반글 프롬프트 생성
 */
export function buildGeneralPrompt({ keyword, communityQuestions, cluster }) {
  return `당신은 반려동물 전문 블로거 '멍냥닥터'입니다.
아래 주제로 네이버 블로그 일반글(가벼운 정보글)을 작성하세요.

## 주제: ${keyword}
${cluster ? `## 관련 키워드: ${cluster}` : ''}

## 커뮤니티 반응
${communityQuestions.map(q => `- "${q}"`).join('\n')}

## 글 구조
1. [도입] "요즘 강사모에서 ${keyword}가 난리입니다" 식으로 시작
2. [꿀팁 3~4가지] 실용적이고 바로 적용 가능한 팁
3. [사료 추천] 관련 사료 추천
4. [마무리] CTA

## CTA (마지막에 반드시 포함)
${CTA_FIXED}

## 작성 규칙
- 1500~2500자
- 문단은 2~3문장
- 가볍고 친근한 톤
- "수의사 출신" 절대 사용 금지
- "[IMAGE:" 금지
- 키워드 "${keyword}"를 자연스럽게 2~3% 밀도로 포함`;
}

/**
 * 템플릿 기반 일반글 초안
 */
export function buildGeneralDraft({ keyword, communityQuestions }) {
  const intro = `요즘 강사모에서 ${keyword} 관련 글이 정말 많아졌습니다.\n\n보호자분들 사이에서 뜨거운 관심을 받고 있는 주제인데요, 핵심 꿀팁을 정리해봤습니다.`;

  const tips = [
    `첫 번째, ${keyword} 관리의 기본은 식이 조절입니다. 사료 성분표를 꼼꼼히 확인하는 습관부터 들여보세요.`,
    `두 번째, 급여량과 급여 횟수를 체크해보세요. 의외로 많은 문제가 여기서 시작됩니다.`,
    `세 번째, 간식 비율을 전체 칼로리의 10% 이내로 유지하세요. 간식이 주식을 밀어내면 영양 불균형이 올 수 있습니다.`,
    `네 번째, 변화는 천천히 주세요. 사료 교체 시 최소 7~10일에 걸쳐 서서히 바꿔주는 게 좋습니다.`,
  ];

  return [
    `## ${keyword}, 꼭 알아야 할 꿀팁 모음`,
    '',
    intro,
    '',
    `### 보호자라면 꼭 알아야 할 꿀팁`,
    '',
    tips.join('\n\n'),
    '',
    `### 사료는 이렇게 골라보세요`,
    '',
    `${keyword}에 신경 쓰고 있다면, 사료 선택이 가장 중요합니다. 원재료 품질이 좋고, 우리 아이 상태에 맞는 제품을 고르는 게 핵심이에요.`,
    '',
    CTA_FIXED,
  ].join('\n');
}
