// 일반글 생성기 — OpenAI 연동 (템플릿 폴백 제거)
import { getDb, closeDb } from '../shared/db.js';
import { buildGeneralPrompt } from './templates/general.js';
import { checkQuality } from './quality-check.js';
import { callOpenAI } from './openai-client.js';

/**
 * 일반글 생성 메인 — OpenAI 사용, 실패 시 템플릿 폴백
 */
export async function createGeneralPosts(options = {}) {
  const { useAI = true } = options;
  const db = getDb();

  const topics = db.prepare(`
    SELECT * FROM trending_topics
    WHERE status = 'selected'
    ORDER BY community_heat DESC
  `).all();

  if (topics.length === 0) {
    console.log('[general] selected 주제 없음');
    return [];
  }

  const insert = db.prepare(`
    INSERT INTO contents (topic_id, type, title, body, tags, status, review_note)
    VALUES (?, 'blog_general', ?, ?, ?, 'draft', ?)
  `);

  const results = [];

  for (const topic of topics) {
    const existing = db.prepare(`
      SELECT id FROM contents WHERE topic_id = ? AND type = 'blog_general'
    `).get(topic.id);
    if (existing) {
      console.log(`[general] #${topic.id} "${topic.keyword}" — 이미 생성됨, 스킵`);
      continue;
    }

    const posts = db.prepare(`
      SELECT title FROM raw_posts
      WHERE source IN ('gangsamo', 'godahang')
        AND (title LIKE ? OR keywords LIKE ?)
      ORDER BY published_at DESC LIMIT 5
    `).all(`%${topic.keyword}%`, `%${topic.keyword}%`);

    const communityQuestions = posts.map(p => p.title).filter(Boolean);
    if (communityQuestions.length === 0 && topic.sample_questions) {
      try { communityQuestions.push(...JSON.parse(topic.sample_questions).slice(0, 3)); } catch { /* ignore */ }
    }

    const prompt = buildGeneralPrompt({ keyword: topic.keyword, communityQuestions, cluster: topic.cluster });
    
    let draft;
    let source = 'openai';

    try {
      draft = await callOpenAI(prompt, {
        systemPrompt: '당신은 반려동물 전문 블로거 "멍냥닥터"입니다. 친근하고 가벼운 톤으로 실용적인 정보를 전달합니다.',
      });
      console.log(`[general] #${topic.id} "${topic.keyword}" — OpenAI 생성 성공`);
    } catch (err) {
      console.error(`[general] #${topic.id} "${topic.keyword}" — OpenAI 실패:`, err.message);
      // 템플릿 폴백 없이 failed 처리
      const failInsert = db.prepare(`
        INSERT INTO contents (topic_id, type, title, body, tags, status, review_note)
        VALUES (?, 'blog_general', ?, '', ?, 'failed', ?)
      `);
      const tags = JSON.stringify([topic.keyword]);
      failInsert.run(topic.id, `${topic.keyword} (생성 실패)`, tags, `❌ OpenAI 호출 실패: ${err.message}`);
      results.push({ topicId: topic.id, keyword: topic.keyword, source: 'failed', issues: [err.message] });
      continue;
    }

    let title = `${topic.keyword}, 꼭 알아야 할 꿀팁 모음`;
    const firstLine = draft.split('\n')[0];
    if (firstLine?.startsWith('#')) {
      title = firstLine.replace(/^#+\s*/, '');
      draft = draft.split('\n').slice(1).join('\n').trim();
    }

    const tags = JSON.stringify([topic.keyword, ...(topic.cluster ? topic.cluster.split(',').map(s => s.trim()) : [])]);
    const issues = checkQuality(draft, topic.keyword);
    const reviewNote = issues.length === 0
      ? `✅ 품질 검증 통과 (${source})`
      : `⚠️ 이슈 ${issues.length}건 (${source}):\n${issues.map(i => `- ${i}`).join('\n')}`;

    const info = insert.run(topic.id, title, draft, tags, reviewNote);
    console.log(`[general] #${topic.id} "${topic.keyword}" → contents #${info.lastInsertRowid} (draft, ${source})`);
    results.push({ topicId: topic.id, contentId: info.lastInsertRowid, keyword: topic.keyword, source, issues });
  }

  console.log(`[general] ${results.length}건 생성 완료`);
  return results;
}

// CLI
if (process.argv[1]?.includes('blog-general')) {
  try {
    const useAI = !process.argv.includes('--no-ai');
    await createGeneralPosts({ useAI });
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    closeDb();
  }
}
