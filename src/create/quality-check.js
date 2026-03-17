// 품질 자동 검증
import { getDb, closeDb } from '../shared/db.js';
import { config } from '../shared/config.js';

const { quality } = config;

// ── 반려동물 주제 검증용 키워드 ──
const PET_TOPIC_WORDS = [
  '사료', '간식', '영양', '건강', '질병', '병원', '수의사', '예방접종', '중성화',
  '알러지', '알레르기', '피부', '소화', '설사', '구토', '비만', '체중', '관절',
  '슬개골', '심장', '신장', '당뇨', '암', '기생충', '벼룩', '진드기', '심장사상충',
  '훈련', '교육', '짖음', '분리불안', '공격성', '배변', '산책', '사회화',
  '품종', '입양', '분양', '유기견', '유기묘', '미용', '목욕', '그루밍',
  '강아지', '고양이', '반려동물', '반려견', '반려묘', '펫',
  '사료', 'food', 'diet', 'health', 'vet', 'training', 'breed', 'allergy',
];

// ── 기계적 패턴 감지 ──
const MECHANICAL_PATTERNS = [
  /의 원인을 살펴보면/,
  /에 대해 자세히 알아보겠습니다/,
  /에 대해 알아보도록 하겠습니다/,
  /에 대해 살펴보겠습니다/,
  /해외에서는 이 주제에 대해 활발한 논의가/,
  /활발한 논의가 이루어지고 있습니다/,
  /많은 전문가들이 주목하고 있습니다/,
  /최근 들어 많은 관심을 받고 있/,
  /에 대한 관심이 높아지고 있/,
  /이에 대해 전문가들은/,
  /결론적으로 말씀드리자면/,
  /이상으로.*에 대해 알아보았습니다/,
  /오늘은.*에 대해 알아보았는데요/,
  /\[키워드\]/,
  /\{키워드\}/,
];

// ── 빈 문장 패턴 (실질적 정보 없는 문장) ──
const EMPTY_SENTENCE_PATTERNS = [
  /^.{0,5}에 대해 많은 분들이 궁금해하시는데요/,
  /^그렇다면.{0,10}은 무엇일까요/,
  /^지금부터 하나씩 살펴보겠습니다/,
  /^이번 포스팅에서는.*다루어 보겠습니다/,
  /^오늘은 이에 대해 자세히 알아보겠습니다/,
  /^많은 보호자님들이 궁금해하시는 부분인데요/,
  /^이 글을 통해.*도움이 되셨으면 합니다/,
];

/**
 * 글 품질 검증. issues 배열 반환.
 */
export function checkQuality(body, keyword) {
  const issues = [];

  // 1. 글자 수
  const len = body.length;
  if (len < quality.minChars) issues.push(`글자 수 부족: ${len}자 (최소 ${quality.minChars})`);
  if (len > quality.maxChars) issues.push(`글자 수 초과: ${len}자 (최대 ${quality.maxChars})`);

  // 2. 금지어
  for (const word of quality.bannedWords) {
    if (body.includes(word)) issues.push(`금지어 포함: "${word}"`);
  }

  // 3. 키워드 밀도
  if (keyword) {
    const count = body.split(keyword).length - 1;
    const density = (count * keyword.length) / len;
    if (density < quality.keywordDensity.min) {
      issues.push(`키워드 밀도 낮음: ${(density * 100).toFixed(1)}% (최소 ${quality.keywordDensity.min * 100}%)`);
    }
    if (density > quality.keywordDensity.max) {
      issues.push(`키워드 밀도 높음: ${(density * 100).toFixed(1)}% (최대 ${quality.keywordDensity.max * 100}%)`);
    }
  }

  // 4. 문단 길이 (3문장 초과 체크)
  const paragraphs = body.split(/\n\n+/).filter(p => p.trim() && !p.startsWith('#') && !p.startsWith('🩺') && !p.startsWith('👉'));
  for (let i = 0; i < paragraphs.length; i++) {
    const sentences = paragraphs[i].split(/[.!?。]\s*/).filter(s => s.trim().length > 5);
    if (sentences.length > quality.maxSentencesPerParagraph) {
      issues.push(`문단 ${i + 1}: ${sentences.length}문장 (최대 ${quality.maxSentencesPerParagraph})`);
    }
  }

  // 5. 반려동물 주제 검증
  if (keyword) {
    const isPetTopic = PET_TOPIC_WORDS.some(w => keyword.includes(w) || w.includes(keyword));
    if (!isPetTopic) {
      issues.push(`주제 불일치: "${keyword}"은(는) 반려동물 관련 주제가 아님`);
    }
  }

  // 6. 기계적 패턴 감지
  const mechanicalHits = MECHANICAL_PATTERNS.filter(p => p.test(body));
  if (mechanicalHits.length >= 3) {
    issues.push(`기계적 패턴 ${mechanicalHits.length}건 감지 — AI 템플릿 의심`);
  }

  // 7. 빈 문장 패턴 감지
  const sentences = body.split(/[.!?。]\s*/).filter(s => s.trim().length > 10);
  let emptyCount = 0;
  for (const sent of sentences) {
    if (EMPTY_SENTENCE_PATTERNS.some(p => p.test(sent.trim()))) emptyCount++;
  }
  if (emptyCount >= 3) {
    issues.push(`빈 문장 ${emptyCount}건 감지 — 실질적 정보 부족`);
  }

  // 8. 소제목 간격 체크
  const lines = body.split('\n');
  const headingIndices = lines.map((l, i) => l.startsWith('#') ? i : -1).filter(i => i >= 0);
  if (headingIndices.length >= 2) {
    const gaps = [];
    for (let i = 1; i < headingIndices.length; i++) {
      gaps.push(headingIndices[i] - headingIndices[i - 1]);
    }
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    for (const gap of gaps) {
      if (Math.abs(gap - avg) > avg * 0.6) {
        issues.push(`소제목 간격 불균형 (평균 ${avg.toFixed(0)}줄, 편차 큼)`);
        break;
      }
    }
  }

  return issues;
}

/**
 * DB의 draft 콘텐츠를 검증하고 review_note 업데이트
 */
export function reviewDrafts() {
  const db = getDb();
  const drafts = db.prepare(`
    SELECT c.id, c.body, t.keyword
    FROM contents c
    LEFT JOIN trending_topics t ON c.topic_id = t.id
    WHERE c.status = 'draft' AND (c.review_note IS NULL OR c.review_note = '')
  `).all();

  const update = db.prepare(`UPDATE contents SET review_note = ?, status = ? WHERE id = ?`);

  let reviewed = 0;
  for (const draft of drafts) {
    if (!draft.body) continue;
    const issues = checkQuality(draft.body, draft.keyword);
    const passed = issues.length === 0;
    // 주제 불일치, 기계적 패턴, 빈 문장이면 rejected 처리
    const isRejectable = issues.some(i =>
      i.includes('주제 불일치') || i.includes('기계적 패턴') || i.includes('빈 문장')
    );
    const note = passed ? '✅ 품질 검증 통과' : `⚠️ 이슈 ${issues.length}건:\n${issues.map(i => `- ${i}`).join('\n')}`;
    const status = passed ? 'review' : isRejectable ? 'rejected' : 'draft';
    update.run(note, status, draft.id);
    reviewed++;
    console.log(`[quality] #${draft.id}: ${passed ? 'PASS' : 'FAIL'} (${issues.length} issues)`);
  }

  console.log(`[quality] ${reviewed}건 검증 완료`);
  return reviewed;
}

// CLI
if (process.argv[1] && process.argv[1].includes('quality-check')) {
  try {
    reviewDrafts();
  } finally {
    closeDb();
  }
}
