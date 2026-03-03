// 품질 자동 검증
import { getDb, closeDb } from '../shared/db.js';
import { config } from '../shared/config.js';

const { quality } = config;

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

  // 5. 소제목 간격 체크
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
    const note = passed ? '✅ 품질 검증 통과' : `⚠️ 이슈 ${issues.length}건:\n${issues.map(i => `- ${i}`).join('\n')}`;
    const status = passed ? 'review' : 'draft';
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
