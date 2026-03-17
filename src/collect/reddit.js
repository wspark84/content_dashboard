import { getDb } from '../shared/db.js';
import { config } from '../shared/config.js';

const SOURCE = 'reddit';
const SUBS = config.sources.reddit.subreddits;

const HEADERS = {
  'User-Agent': 'mungnyang-viral/1.0 (pet content research bot)',
};

async function fetchSubreddit(sub, limit = 25) {
  const posts = [];
  try {
    const url = `https://www.reddit.com/r/${sub}/hot.json?limit=${limit}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    for (const child of (data?.data?.children || [])) {
      const d = child.data;
      if (d.stickied) continue;
      posts.push({
        id: `${SOURCE}_${d.id}`,
        source: SOURCE,
        board: sub,
        title: d.title || '',
        body: (d.selftext || '').slice(0, 500),
        url: `https://reddit.com${d.permalink}`,
        author: d.author || '',
        views: 0,
        likes: d.ups || 0,
        comments: d.num_comments || 0,
        published_at: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : null,
      });
    }
  } catch (e) {
    console.warn(`[${SOURCE}] r/${sub} failed: ${e.message}`);
  }
  return posts;
}

function savePosts(posts) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO raw_posts (id, source, board, title, body, url, author, views, likes, comments, published_at)
    VALUES (@id, @source, @board, @title, @body, @url, @author, @views, @likes, @comments, @published_at)
  `);
  let count = 0;
  for (const p of posts) {
    try { const r = stmt.run(p); if (r.changes) count++; } catch {}
  }
  return count;
}

export async function collectReddit() {
  console.log(`[${SOURCE}] Starting collection...`);
  const allPosts = [];
  for (const sub of SUBS) {
    const posts = await fetchSubreddit(sub);
    allPosts.push(...posts);
    console.log(`[${SOURCE}] r/${sub}: ${posts.length} posts`);
    await new Promise(r => setTimeout(r, 1000)); // Reddit rate limit
  }
  const saved = savePosts(allPosts);
  console.log(`[${SOURCE}] Done. ${allPosts.length} fetched, ${saved} new saved.`);
  return allPosts;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  collectReddit().catch(console.error);
}
