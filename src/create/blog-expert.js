// 전문글 생성기 — OpenAI 연동 + 템플릿 폴백
import { getDb, closeDb } from '../shared/db.js';
import { buildExpertPrompt, buildExpertDraft } from './templates/expert.js';
import { checkQuality } from './quality-check.js';
import { callOpenAI } from './openai-client.js';

/**
 * 커뮤니티 질문과 Reddit 인사이트 수집
 */
function gatherMaterial(db, topic) {
  const keyword = topic.keyword;

  const communityPosts = db.prepare(`
    SELECT title, body FROM raw_posts
    WHERE source IN ('gangsamo', 'godahang')
      AND (title LIKE ? OR body LIKE ? OR keywords LIKE ?)
    ORDER BY published_at DESC LIMIT 5
  `).all(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);

  const communityQuestions = communityPosts.map(p => p.title).filter(Boolean);

  const redditPosts = db.prepare(`
    SELECT title, body FROM raw_posts
    WHERE source = 'reddit'
      AND (title LIKE ? OR body LIKE ? OR keywords LIKE ?)
    ORDER BY published_at DESC LIMIT 3
  `).all(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);

  const redditInsights = redditPosts.map(p => {
    const snippet = p.body ? p.body.slice(0, 200) : p.title;
    return snippet;
  }).filter(Boolean);

  if (communityQuestions.length === 0 && topic.sample_questions) {
    try {
      communityQuestions.push(...JSON.parse(topic.sample_questions).slice(0, 3));
    } catch { /* ignore */ }
  }

  return { communityQuestions, redditInsights };
}

/**
 * 전문글 생성 메인 — OpenAI 사용, 실패 시 템플릿 폴백
 */
export async function createExpertPosts(options = {}) {
  const { useAI = true } = options;
  const db = getDb();

  const topics = db.prepare(`
    SELECT * FROM trending_topics
    WHERE status = 'selected'
    ORDER BY score DESC
  `).all();

  if (topics.length === 0) {
    console.log('[expert] selected 주제 없음');
    return [];
  }

  const insert = db.prepare(`
    INSERT INTO contents (topic_id, type, title, body, tags, status, review_note)
    VALUES (?, 'blog_expert', ?, ?, ?, 'draft', ?)
  `);

  const results = [];

  for (const topic of topics) {
    const existing = db.prepare(`
      SELECT id FROM contents WHERE topic_id = ? AND type = 'blog_expert'
    `).get(topic.id);
    if (existing) {
      console.log(`[expert] #${topic.id} "${topic.keyword}" — 이미 생성됨, 스킵`);
      continue;
    }

    const { communityQuestions, redditInsights } = gatherMaterial(db, topic);
    const prompt = buildExpertPrompt({ keyword: topic.keyword, communityQuestions, redditInsights, cluster: topic.cluster });
    
    let draft;
    let source = 'template';

    if (useAI) {
      try {
        draft = await callOpenAI(prompt);
        source = 'openai';
        console.log(`[expert] #${topic.id} "${topic.keyword}" — OpenAI 생성 성공`);
      } catch (err) {
        console.warn(`[expert] OpenAI 실패, 템플릿 폴백:`, err.message);
        draft = buildExpertDraft({ keyword: topic.keyword, communityQuestions, redditInsights });
      }
    } else {
      draft = buildExpertDraft({ keyword: topic.keyword, communityQuestions, redditInsights });
    }

    // 제목 추출 또는 기본 제목
    let title = `${topic.keyword}, 전문가가 알려드립니다`;
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
    console.log(`[expert] #${topic.id} "${topic.keyword}" → contents #${info.lastInsertRowid} (draft, ${source})`);
    results.push({ topicId: topic.id, contentId: info.lastInsertRowid, keyword: topic.keyword, source, issues });
  }

  console.log(`[expert] ${results.length}건 생성 완료`);
  return results;
}

// CLI
if (process.argv[1]?.includes('blog-expert')) {
  try {
    const useAI = !process.argv.includes('--no-ai');
    await createExpertPosts({ useAI });
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    closeDb();
  }
}
