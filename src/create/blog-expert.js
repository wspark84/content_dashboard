// 전문글 생성기 — 프롬프트 생성 + 템플릿 초안 + DB 저장
import { getDb, closeDb } from '../shared/db.js';
import { buildExpertPrompt, buildExpertDraft } from './templates/expert.js';
import { checkQuality } from './quality-check.js';

/**
 * selected 주제에서 커뮤니티 질문과 Reddit 인사이트를 가져온다.
 */
function gatherMaterial(db, topic) {
  const keyword = topic.keyword;

  // 커뮤니티 질문 (강사모/고다행)
  const communityPosts = db.prepare(`
    SELECT title, body FROM raw_posts
    WHERE source IN ('gangsamo', 'godahang')
      AND (title LIKE ? OR body LIKE ? OR keywords LIKE ?)
    ORDER BY published_at DESC LIMIT 5
  `).all(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);

  const communityQuestions = communityPosts.map(p => p.title).filter(Boolean);

  // Reddit 인사이트
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

  // sample_questions 보충
  if (communityQuestions.length === 0 && topic.sample_questions) {
    try {
      const sq = JSON.parse(topic.sample_questions);
      communityQuestions.push(...sq.slice(0, 3));
    } catch { /* ignore */ }
  }

  return { communityQuestions, redditInsights };
}

/**
 * 전문글 생성 메인
 */
export function createExpertPosts() {
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
    // 이미 생성된 콘텐츠가 있는지 체크
    const existing = db.prepare(`
      SELECT id FROM contents WHERE topic_id = ? AND type = 'blog_expert'
    `).get(topic.id);
    if (existing) {
      console.log(`[expert] #${topic.id} "${topic.keyword}" — 이미 생성됨, 스킵`);
      continue;
    }

    const { communityQuestions, redditInsights } = gatherMaterial(db, topic);

    // 프롬프트 생성 (크론잡에서 Claude 호출 시 사용)
    const prompt = buildExpertPrompt({
      keyword: topic.keyword,
      communityQuestions,
      redditInsights,
      cluster: topic.cluster,
    });

    // 템플릿 기반 초안 (LLM 없이)
    const draft = buildExpertDraft({
      keyword: topic.keyword,
      communityQuestions,
      redditInsights,
    });

    const title = `${topic.keyword}, 전문가가 알려드립니다`;
    const tags = JSON.stringify([topic.keyword, ...(topic.cluster ? topic.cluster.split(',').map(s => s.trim()) : [])]);

    // 품질 검증
    const issues = checkQuality(draft, topic.keyword);
    const reviewNote = issues.length === 0
      ? '✅ 품질 검증 통과'
      : `⚠️ 이슈 ${issues.length}건:\n${issues.map(i => `- ${i}`).join('\n')}\n\n---\n[프롬프트]\n${prompt}`;

    const info = insert.run(topic.id, title, draft, tags, reviewNote);
    console.log(`[expert] #${topic.id} "${topic.keyword}" → contents #${info.lastInsertRowid} (draft)`);

    results.push({ topicId: topic.id, contentId: info.lastInsertRowid, keyword: topic.keyword, issues });
  }

  console.log(`[expert] ${results.length}건 생성 완료`);
  return results;
}

// CLI
if (process.argv[1] && process.argv[1].includes('blog-expert')) {
  try {
    createExpertPosts();
  } finally {
    closeDb();
  }
}
