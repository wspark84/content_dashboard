import * as cheerio from 'cheerio';
import { getDb } from '../shared/db.js';
import { config } from '../shared/config.js';

const SOURCE = 'godahang';
const CAFE_ID = config.sources.godahang.cafeId;
const CAFE_NAME = 'godahang';
const BOARDS = config.sources.godahang.boards;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
};

async function fetchBoardViaMobileApi(boardId, boardName, limit = 20) {
  const posts = [];
  try {
    const url = boardId === 0
      ? `https://apis.naver.com/cafe-web/cafe-mobile/CafeMobileWebArticleSearchListV3?cafeId=${CAFE_ID}&pack=true&query=&page=1&perPage=${limit}&sortBy=date`
      : `https://apis.naver.com/cafe-web/cafe-mobile/CafeMobileWebArticleSearchListV3?cafeId=${CAFE_ID}&menuId=${boardId}&pack=true&query=&page=1&perPage=${limit}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`API HTTP ${res.status}`);
    const data = await res.json();
    const articles = data?.message?.result?.articleList || [];
    for (const a of articles) {
      posts.push({
        id: `${SOURCE}_${a.articleId}`,
        source: SOURCE,
        board: boardName,
        title: a.subject || '',
        body: (a.contentSummary || '').slice(0, 500),
        url: `https://cafe.naver.com/${CAFE_NAME}/${a.articleId}`,
        author: a.nickname || '',
        views: a.readCount || 0,
        likes: a.likeItCount || 0,
        comments: a.commentCount || 0,
        published_at: a.writeDateTimestamp ? new Date(a.writeDateTimestamp).toISOString() : null,
      });
    }
  } catch (e) {
    console.warn(`[${SOURCE}] API for ${boardName} failed: ${e.message}, trying search fallback`);
  }
  return posts;
}

async function fetchViaNaverSearch(boardName, limit = 10) {
  const posts = [];
  try {
    const queryMap = { popular: '고양이', food: '고양이 사료', health: '고양이 건강' };
    const query = queryMap[boardName] || '고양이';
    const url = `https://m.search.naver.com/search.naver?where=m&query=${encodeURIComponent(query + ' site:cafe.naver.com/godahang')}&sm=mob_hty`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return posts;
    const html = await res.text();
    const $ = cheerio.load(html);
    $('a').each((i, el) => {
      if (posts.length >= limit) return false;
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (!href.includes('cafe.naver.com') || text.length < 10 || text.length > 100) return;
      if (text.includes('지식iN') || text.includes('질문하기') || text.includes('궁금한것은')) return;
      posts.push({
        id: `${SOURCE}_s_${Buffer.from(href).toString('base64').slice(0, 20)}`,
        source: SOURCE,
        board: boardName,
        title: text,
        body: '',
        url: href,
        author: '',
        views: 0, likes: 0, comments: 0,
        published_at: null,
      });
    });
  } catch (e) {
    console.warn(`[${SOURCE}] search fallback for ${boardName} failed: ${e.message}`);
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

export async function collectGodahang() {
  console.log(`[${SOURCE}] Starting collection...`);
  const allPosts = [];
  for (const [name, id] of Object.entries(BOARDS)) {
    let posts = await fetchBoardViaMobileApi(id, name);
    if (posts.length === 0) {
      posts = await fetchViaNaverSearch(name);
    }
    allPosts.push(...posts);
    console.log(`[${SOURCE}] ${name}: ${posts.length} posts`);
  }
  const saved = savePosts(allPosts);
  console.log(`[${SOURCE}] Done. ${allPosts.length} fetched, ${saved} new saved.`);
  return allPosts;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  collectGodahang().catch(console.error);
}
