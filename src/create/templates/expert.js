// 전문글 템플릿
export const CTA_FIXED = `🩺 우리 아이도 맞춤 상담이 필요하신가요?
고민하지 말고 멍냥닥터에게 직접 물어보세요.
👉 https://open.kakao.com/o/gkkLxt9h`;

/**
 * 전문글 프롬프트를 생성한다.
 * 실제 글 생성은 Claude 크론잡이 이 프롬프트로 호출.
 */
export function buildExpertPrompt({ keyword, communityQuestions, redditInsights, cluster }) {
  return `당신은 반려동물 영양학 전문가 '멍냥닥터'입니다.
아래 주제로 네이버 블로그 전문글을 작성하세요.

## 주제: ${keyword}
${cluster ? `## 관련 키워드 클러스터: ${cluster}` : ''}

## 커뮤니티 실제 질문들
${communityQuestions.map(q => `- "${q}"`).join('\n')}

## 해외 인사이트 (Reddit/논문)
${redditInsights.map(r => `- ${r}`).join('\n')}

## 글 구조 (반드시 준수)
1. [도입] 커뮤니티 질문 인용으로 시작. "최근 커뮤니티에서 이런 고민이 많았습니다..."
2. [해외 인사이트] Reddit/논문 기반. "해외에서는..."
3. [원인 분석] 수의영양학 근거 + 쉬운 설명
4. [사료 추천] 키워드 관련 사료 추천
5. [마무리] 아래 CTA 문구 그대로 사용

## CTA (마지막에 반드시 포함)
${CTA_FIXED}

## 작성 규칙
- 1500~2500자
- 문단은 2~3문장
- 소제목 사이 간격 일정하게
- "수의사 출신" 절대 사용 금지
- "[IMAGE:" 금지
- 번호 리스트 자제, 자연스러운 서술 위주
- 키워드 "${keyword}"를 자연스럽게 2~3% 밀도로 포함
- 전문적이되 보호자가 이해할 수 있게 쉽게`;
}

/**
 * 프롬프트 없이 템플릿 기반 초안 생성 (placeholder)
 */
export function buildExpertDraft({ keyword, communityQuestions, redditInsights }) {
  const intro = communityQuestions.length > 0
    ? `최근 커뮤니티에서 이런 고민이 많았습니다.\n\n"${communityQuestions[0]}"\n\n많은 보호자분들이 ${keyword}에 대해 궁금해하고 계세요. 오늘은 이 주제를 깊이 있게 다뤄보겠습니다.`
    : `${keyword}, 많은 보호자분들이 궁금해하는 주제입니다. 오늘은 이 부분을 자세히 알아보겠습니다.`;

  const overseas = redditInsights.length > 0
    ? `해외에서는 어떻게 보고 있을까요?\n\n${redditInsights.slice(0, 2).map(r => r).join('\n\n')}`
    : `해외에서는 이 주제에 대해 활발한 논의가 이루어지고 있습니다.`;

  const analysis = `${keyword}의 원인을 살펴보면, 영양학적 관점에서 몇 가지 핵심 포인트가 있습니다.\n\n반려동물의 식이와 직접적으로 연관되는 부분이기 때문에, 사료 선택이 매우 중요합니다.`;

  const recommendation = `사료를 고를 때는 ${keyword} 관련 성분을 꼼꼼히 확인해야 합니다.\n\n원재료 목록에서 첫 번째 성분이 동물성 단백질인지, 알러지 유발 원료가 포함되어 있지 않은지 체크해보세요.`;

  return [
    `## ${keyword}, 전문가가 알려드립니다`,
    '',
    intro,
    '',
    `### 해외에서는 어떻게 보고 있을까?`,
    '',
    overseas,
    '',
    `### 원인과 메커니즘`,
    '',
    analysis,
    '',
    `### 사료 선택 가이드`,
    '',
    recommendation,
    '',
    `### 멍냥닥터의 한마디`,
    '',
    `${keyword}는 올바른 정보와 꾸준한 관리가 핵심입니다. 우리 아이에게 맞는 방법을 찾아가는 과정이 중요해요.`,
    '',
    CTA_FIXED,
  ].join('\n');
}
