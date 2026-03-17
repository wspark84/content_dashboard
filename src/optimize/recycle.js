/**
 * 재활용 엔진
 * - 고성과 콘텐츠 자동 감지
 * - 제목/도입부 변경 + 최신 데이터 반영
 * - 다른 채널 포맷 변환
 * - contents 테이블에 새 draft INSERT (원본 참조)
 * 
 * recycler.js 확장 래퍼 — OpenAI 연동 재작성 + 자동화
 */
import { getDb, closeDb } from '../shared/db.js';
import { findHighPerformers, suggestRecycle, createRecycledContent } from './recycler.js';
import { callOpenAI } from '../create/openai-client.js';

/**
 * 고성과 콘텐츠 자동 감지 + 재활용 제안
 */
export function autoDetectAndSuggest(topPercent = 10) {
  const topContents = findHighPerformers(topPercent);
  console.log(`[recycle] 상위 ${topPercent}% 고성과 콘텐츠: ${topContents.length}건`);

  const suggestions = [];
  for (const content of topContents) {
    const suggestion = suggestRecycle(content.id);
    if (suggestion.suggestions && suggestion.suggestions.length > 0) {
      suggestions.push(suggestion);
    }
  }

  console.log(`[recycle] 재활용 가능: ${suggestions.length}건`);
  return suggestions;
}

/**
 * OpenAI를 사용한 고품질 재활용 콘텐츠 생성
 */
export async function recycleWithAI(contentId, targetType) {
  const db = getDb();
  const original = db.prepare('SELECT * FROM contents WHERE id = ?').get(contentId);
  if (!original) throw new Error(`Content #${contentId} not found`);

  const prompt = buildRecyclePrompt(original, targetType);

  try {
    const aiContent = await callOpenAI(prompt);
    
    // 제목 추출 (첫 줄이 ##로 시작하면 제목)
    const lines = aiContent.split('\n');
    let title = `[${targetType}] ${original.title}`;
    let body = aiContent;
    
    if (lines[0]?.startsWith('#')) {
      title = lines[0].replace(/^#+\s*/, '');
      body = lines.slice(1).join('\n').trim();
    }

    const result = db.prepare(`
      INSERT INTO contents (topic_id, type, title, body, tags, status, review_note, created_at)
      VALUES (?, ?, ?, ?, ?, 'draft', ?, datetime('now'))
    `).run(
      original.topic_id,
      targetType === 'update' || targetType === 'seasonal' ? original.type : targetType,
      title, body, original.tags,
      `♻️ 원본 #${contentId} 재활용 (AI 생성)`
    );

    console.log(`[recycle] AI 재활용 완료: #${contentId} → #${result.lastInsertRowid} (${targetType})`);
    return { id: result.lastInsertRowid, title, type: targetType, status: 'draft', originalId: contentId };
  } catch (err) {
    console.error(`[recycle] AI 재활용 실패, 템플릿 폴백:`, err.message);
    return createRecycledContent(contentId, targetType);
  }
}

function buildRecyclePrompt(original, targetType) {
  const currentMonth = new Date().getMonth() + 1;
  const seasonMap = {
    1: '겨울', 2: '겨울', 3: '봄', 4: '봄', 5: '초여름',
    6: '여름', 7: '여름', 8: '여름', 9: '가을', 10: '가을', 11: '초겨울', 12: '겨울'
  };

  const basePrompt = `원본 콘텐츠를 아래 형식으로 재작성하세요.\n\n원본 제목: ${original.title}\n원본 내용:\n${(original.body || '').slice(0, 2000)}\n\n현재 계절: ${seasonMap[currentMonth]}`;

  switch (targetType) {
    case 'card_news':
      return `${basePrompt}\n\n카드뉴스 형식으로 변환하세요:\n- 슬라이드 5~7장\n- 각 슬라이드: 제목 + 핵심 문장 1~2개\n- 마지막 슬라이드: CTA`;
    case 'short_video':
      return `${basePrompt}\n\n15~30초 숏폼 스크립트로 변환하세요:\n- 훅 (3초): 시선 잡는 한 줄\n- 본문 (15초): 핵심 정보\n- CTA (5초): 행동 유도`;
    case 'blog_general':
      return `${basePrompt}\n\n가벼운 블로그 일반글로 재작성하세요:\n- 친근한 톤\n- 꿀팁 3~4가지\n- 1500~2500자`;
    case 'update':
      return `${basePrompt}\n\n최신 정보를 반영하여 업데이트 버전을 작성하세요:\n- 기존 구조 유지\n- 최신 트렌드/데이터 추가\n- [업데이트] 섹션 추가`;
    case 'seasonal':
      return `${basePrompt}\n\n현재 계절(${seasonMap[currentMonth]})에 맞게 재작성하세요:\n- 계절 키워드 자연스럽게 포함\n- 시의성 있는 정보 추가`;
    default:
      return `${basePrompt}\n\n${targetType} 형식으로 재작성하세요.`;
  }
}

/**
 * 자동 재활용 파이프라인
 */
export async function autoRecycle(options = {}) {
  const { topPercent = 10, useAI = false, maxItems = 5 } = options;
  
  const suggestions = autoDetectAndSuggest(topPercent);
  const results = [];

  for (const suggestion of suggestions.slice(0, maxItems)) {
    if (!suggestion.suggestions?.length) continue;
    
    const target = suggestion.suggestions[0]; // 첫 번째 추천 사용
    try {
      let result;
      if (useAI) {
        result = await recycleWithAI(suggestion.contentId, target.targetType);
      } else {
        result = createRecycledContent(suggestion.contentId, target.targetType);
      }
      results.push(result);
    } catch (err) {
      console.error(`[recycle] #${suggestion.contentId} 재활용 실패:`, err.message);
    }
  }

  console.log(`[recycle] 자동 재활용 완료: ${results.length}건`);
  return results;
}

// CLI
if (process.argv[1]?.includes('recycle')) {
  try {
    console.log('=== Recycle Engine ===');
    
    // 고성과 콘텐츠 감지
    const topContents = findHighPerformers(10);
    console.log(`고성과 콘텐츠: ${topContents.length}건`);

    // 재활용 제안
    const suggestions = autoDetectAndSuggest(10);
    for (const s of suggestions.slice(0, 3)) {
      console.log(`  #${s.contentId} "${s.title}" → ${s.suggestions.map(x => x.targetType).join(', ')}`);
    }

    console.log('✅ recycle.js OK');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    closeDb();
  }
}
