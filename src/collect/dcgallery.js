import * as cheerio from 'cheerio';
import { getDb } from '../shared/db.js';
import { config } from '../shared/config.js';

const SOURCE = 'dc';
const GALLERIES = config.sources.dcGallery.galleries;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
};

/**
 * DC갤러리 날짜 텍스트를 ISO 형식으로 변환
 * "04.07", "04-07", "16:30", "2026.04.07" 등 처리
 */
function parseDcDate(dateText) {
  if (!dateText) return null;
  const now = new Date();
  // "HH:MM" 형식 (오늘 작성)
  if (/^\d{1,2}:\d{2}$/.test(dateText)) {
    const [h, m] = dateText.split(':').map(Number);
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    return d.toISOString();
  }
  // "MM.DD" 또는 "MM-DD" 형식
  const md = dateText.match(/^(\d{1,2})[.\-](\d{1,2})$/);
  if (md) {
    const d = new Date(now.getFullYear(), parseInt(md[1]) - 1, parseInt(md[2]));
    return d.toISOString();
  }
  // "YYYY.MM.DD" 형식
  const ymd = dateText.match(/(\d{4})[.\-](\d{1,2})[.\-](\d{1,2})/);
  if (ymd) {
    return new Date(`${ymd[1]}-${ymd[2].padStart(2,'0')}-${ymd[3].padStart(2,'0')}T00:00:00+09:00`).toISOString();
  }
  return null;
}

async function fetchGallery(galleryId) {
  const posts = [];
  try {
    // Use mobile DC gallery (no JS rendering needed)
    const url = `https://m.dcinside.com/board/${galleryId}?page=1`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    $('ul.gall-detail-lst > li').each((_, el) => {
      const $el = $(el);
      const linkEl = $el.find('a.lt').first();
      const href = linkEl.attr('href') || '';
      if (!href) return;

      const title = $el.find('.subjectin').text().trim();
      if (!title) return;

      const author = $el.find('.ginfo li').first().text().trim();
      const dateText = $el.find('.ginfo li').eq(1).text().trim();
      const viewText = $el.find('.ginfo li').eq(2).text().trim();
      const recommText = $el.find('.ginfo li').eq(3).text().trim();

      // Extract article ID from URL
      const match = href.match(/\/board\/[^/]+\/(\d+)/);
      const artId = match ? match[1] : href;

      posts.push({
        id: `${SOURCE}_${galleryId}_${artId}`,
        source: SOURCE,
        board: galleryId,
        title,
        body: '',
        url: href.startsWith('http') ? href : `https://m.dcinside.com${href}`,
        author,
        views: parseInt(viewText.replace(/[^0-9]/g, '')) || 0,
        likes: parseInt(recommText.replace(/[^0-9]/g, '')) || 0,
        comments: parseInt($el.find('.ct').text().replace(/[^0-9]/g, '')) || 0,
        published_at: parseDcDate(dateText) || new Date().toISOString(),
      });
    });
  } catch (e) {
    console.warn(`[${SOURCE}] gallery ${galleryId} failed: ${e.message}`);
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

export async function collectDcGallery() {
  console.log(`[${SOURCE}] Starting collection...`);
  const allPosts = [];
  for (const gid of GALLERIES) {
    const posts = await fetchGallery(gid);
    allPosts.push(...posts);
    console.log(`[${SOURCE}] ${gid}: ${posts.length} posts`);
    await new Promise(r => setTimeout(r, 500));
  }
  const saved = savePosts(allPosts);
  console.log(`[${SOURCE}] Done. ${allPosts.length} fetched, ${saved} new saved.`);
  return allPosts;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  collectDcGallery().catch(console.error);
}
