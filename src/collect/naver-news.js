import * as cheerio from 'cheerio';
import { getDb } from '../shared/db.js';
import { config } from '../shared/config.js';

const SOURCE = 'naver_news';
const KEYWORDS = config.sources.naverNews.keywords;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
};

/**
 * 네이버 뉴스 날짜 텍스트를 ISO 문자열로 변환
 * "1일 전", "3시간 전", "2026.04.07.", "4분 전" 등 처리
 */
function resolveDate(text) {
  if (!text) return null;
  // YYYY.MM.DD. 형식
  const ymd = text.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (ymd) return new Date(`${ymd[1]}-${ymd[2].padStart(2,'0')}-${ymd[3].padStart(2,'0')}T00:00:00+09:00`).toISOString();
  // N일 전
  const daysAgo = text.match(/(\d+)일\s*전/);
  if (daysAgo) { const d = new Date(); d.setDate(d.getDate() - parseInt(daysAgo[1])); return d.toISOString(); }
  // N시간 전
  const hoursAgo = text.match(/(\d+)시간\s*전/);
  if (hoursAgo) { const d = new Date(); d.setHours(d.getHours() - parseInt(hoursAgo[1])); return d.toISOString(); }
  // N분 전
  const minsAgo = text.match(/(\d+)분\s*전/);
  if (minsAgo) { const d = new Date(); d.setMinutes(d.getMinutes() - parseInt(minsAgo[1])); return d.toISOString(); }
  return null;
}

async function searchNews(keyword, limit = 10) {
  const posts = [];
  try {
    const url = `https://m.search.naver.com/search.naver?where=m_news&query=${encodeURIComponent(keyword)}&sort=1`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Collect unique news article links with titles and dates
    const seen = new Set();
    // Extract date info from news items (각 뉴스 아이템의 날짜 정보 수집)
    const dateMap = new Map();
    $('span.info').each((_, el) => {
      const txt = $(el).text().trim();
      // "N일 전", "N시간 전", "YYYY.MM.DD." 등
      const parent = $(el).closest('li, div, .news_wrap, .bx');
      const link = parent.find('a[href*="news.naver.com/article"], a[href*="entertain.naver.com/article"]').attr('href');
      if (link) {
        const resolved = resolveDate(txt);
        if (resolved) dateMap.set(link, resolved);
      }
    });

    $('a').each((i, el) => {
      if (posts.length >= limit) return false;
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      // Only news article links with substantial title text
      if (text.length < 15 || text.length > 100) return;
      if (!href.includes('news.naver.com/article') && !href.includes('entertain.naver.com/article')) return;
      if (seen.has(href)) return;
      seen.add(href);

      posts.push({
        id: `${SOURCE}_${Buffer.from(href).toString('base64').slice(0, 30)}`,
        source: SOURCE,
        board: keyword,
        title: text,
        body: '',
        url: href,
        author: '',
        views: 0, likes: 0, comments: 0,
        published_at: dateMap.get(href) || new Date().toISOString(),
      });
    });

    // If naver links are scarce, also grab external news links
    if (posts.length < 3) {
      $('a').each((i, el) => {
        if (posts.length >= limit) return false;
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        if (text.length < 15 || text.length > 100) return;
        if (seen.has(href)) return;
        if (!href.startsWith('http')) return;
        if (href.includes('naver.com/search') || href.includes('search.naver')) return;
        // External news sites
        if (href.includes('articleView') || href.includes('/news/') || href.includes('/article/')) {
          seen.add(href);
          posts.push({
            id: `${SOURCE}_${Buffer.from(href).toString('base64').slice(0, 30)}`,
            source: SOURCE,
            board: keyword,
            title: text,
            body: '',
            url: href,
            author: '',
            views: 0, likes: 0, comments: 0,
            published_at: dateMap.get(href) || new Date().toISOString(),
          });
        }
      });
    }
  } catch (e) {
    console.warn(`[${SOURCE}] keyword "${keyword}" failed: ${e.message}`);
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

export async function collectNaverNews() {
  console.log(`[${SOURCE}] Starting collection...`);
  const allPosts = [];
  for (const kw of KEYWORDS) {
    const posts = await searchNews(kw);
    allPosts.push(...posts);
    console.log(`[${SOURCE}] "${kw}": ${posts.length} articles`);
    await new Promise(r => setTimeout(r, 500));
  }
  const saved = savePosts(allPosts);
  console.log(`[${SOURCE}] Done. ${allPosts.length} fetched, ${saved} new saved.`);
  return allPosts;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  collectNaverNews().catch(console.error);
}
