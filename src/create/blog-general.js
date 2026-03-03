// 일반글 생성기 — 커뮤니티 핫토픽 기반 가벼운 글
import { getDb, closeDb } from '../shared/db.js';
import { buildGeneralPrompt, buildGeneralDraft } from './templates/general.js';
import { checkQuality } from './quality-check.js';

/**
 * 일반글 생성 메인
 */
export function createGeneralPosts() {
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

    // 커뮤니티 질문
    const posts = db.prepare(`
      SELECT title FROM raw_posts
      WHERE source IN ('gangsamo', 'godahang')
        AND (title LIKE ? OR keywords LIKE ?)
      ORDER BY published_at DESC LIMIT 5
    `).all(`%${topic.keyword}%`, `%${topic.keyword}%`);

    const communityQuestions = posts.map(p => p.title).filter(Boolean);

    if (communityQuestions.length === 0 && topic.sample_questions) {
      try {
        communityQuestions.push(...JSON.parse(topic.sample_questions).slice(0, 3));
      } catch { /* ignore */ }
    }

    const prompt = buildGeneralPrompt({
      keyword: topic.keyword,
      communityQuestions,
      cluster: topic.cluster,
    });

    const draft = buildGeneralDraft({
      keyword: topic.keyword,
      communityQuestions,
    });

    const title = `${topic.keyword}, 꼭 알아야 할 꿀팁 모음`;
    const tags = JSON.stringify([topic.keyword, ...(topic.cluster ? topic.cluster.split(',').map(s => s.trim()) : [])]);

    const issues = checkQuality(draft, topic.keyword);
    const reviewNote = issues.length === 0
      ? '✅ 품질 검증 통과'
      : `⚠️ 이슈 ${issues.length}건:\n${issues.map(i => `- ${i}`).join('\n')}\n\n---\n[프롬프트]\n${prompt}`;

    const info = insert.run(topic.id, title, draft, tags, reviewNote);
    console.log(`[general] #${topic.id} "${topic.keyword}" → contents #${info.lastInsertRowid} (draft)`);

    results.push({ topicId: topic.id, contentId: info.lastInsertRowid, keyword: topic.keyword, issues });
  }

  console.log(`[general] ${results.length}건 생성 완료`);
  return results;
}

// CLI
if (process.argv[1] && process.argv[1].includes('blog-general')) {
  try {
    createGeneralPosts();
  } finally {
    closeDb();
  }
}
