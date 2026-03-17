#!/usr/bin/env node
/**
 * 반려동물 트렌드 크롤러 v2
 * RSS + JSON API 기반 안정적 크롤링
 * 
 * 소스:
 * 1. Google News RSS (반려동물/사료/펫푸드)
 * 2. 데일리벳 RSS (/feed)
 * 3. Reddit JSON API (r/dogs, r/cats)
 * 4. DC갤러리 (강아지/고양이 인기글)
 * 5. Brave Search (영어 글로벌 뉴스)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

// ============================================================
// UTILS
// ============================================================

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
];

function randomUA() { return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function randomDelay() { return sleep(500 + Math.random() * 1000); }

async function safeFetch(url, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': randomUA(), 'Accept': '*/*', ...opts.headers },
      ...opts,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

// Simple XML tag extractor (no cheerio dependency for RSS)
function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  if (!m) return '';
  let val = m[1].trim();
  // Handle CDATA
  const cdataMatch = val.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  if (cdataMatch) val = cdataMatch[1];
  return val;
}

function extractItems(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = re.exec(xml)) !== null) {
    items.push(match[1]);
  }
  return items;
}

function stripHtml(str) {
  return str.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, '').trim();
}

// ============================================================
// CRAWLERS
// ============================================================

// 1. Google News RSS — 가장 안정적인 한국어 뉴스 소스
async function crawlGoogleNews(query, label) {
  console.log(`📰 Google News RSS: "${query}"`);
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
    const res = await safeFetch(url);
    const xml = await res.text();
    const items = extractItems(xml);

    const results = items.slice(0, 5).map(item => {
      const rawTitle = stripHtml(extractTag(item, 'title'));
      // Google News title format: "제목 - 출처"
      const parts = rawTitle.split(' - ');
      const source = parts.length > 1 ? parts.pop().trim() : 'Google News';
      const title = parts.join(' - ').trim();
      const link = extractTag(item, 'link');
      const pubDate = extractTag(item, 'pubDate');

      return { title, description: title, sourceUrl: link, source, date: pubDate };
    }).filter(r => r.title);

    console.log(`  ✅ ${results.length}개`);
    return results;
  } catch (e) {
    console.error(`  ❌ Google News "${query}" 실패:`, e.message);
    return [];
  }
}

// 2. 데일리벳 RSS
async function crawlDailyvet() {
  console.log(`🏥 데일리벳 RSS`);
  try {
    const res = await safeFetch('https://www.dailyvet.co.kr/feed');
    const xml = await res.text();
    const items = extractItems(xml);

    const results = items.slice(0, 5).map(item => {
      const title = stripHtml(extractTag(item, 'title'));
      const link = extractTag(item, 'link');
      const desc = stripHtml(extractTag(item, 'description')).substring(0, 200);
      const pubDate = extractTag(item, 'pubDate');

      return { title, description: desc || title, sourceUrl: link, source: '데일리벳', date: pubDate };
    }).filter(r => r.title);

    console.log(`  ✅ ${results.length}개`);
    return results;
  } catch (e) {
    console.error(`  ❌ 데일리벳 실패:`, e.message);
    return [];
  }
}

// 3. Reddit JSON API
async function crawlReddit(subreddit) {
  console.log(`🔥 Reddit r/${subreddit}`);
  try {
    const res = await safeFetch(`https://old.reddit.com/r/${subreddit}/hot.json?limit=5`, {
      headers: { 'Accept': 'application/json' }
    });
    const data = await res.json();
    const posts = data?.data?.children || [];

    const results = posts
      .filter(p => !p.data.stickied)
      .slice(0, 5)
      .map(p => {
        const d = p.data;
        return {
          title: d.title,
          description: (d.selftext || d.title).substring(0, 200),
          sourceUrl: `https://reddit.com${d.permalink}`,
          source: `Reddit r/${subreddit}`,
          viralScore: Math.min(60 + Math.log10(Math.max(d.score, 1)) * 10, 95),
          date: new Date(d.created_utc * 1000).toISOString()
        };
      });

    console.log(`  ✅ ${results.length}개`);
    return results;
  } catch (e) {
    console.error(`  ❌ Reddit r/${subreddit} 실패:`, e.message);
    return [];
  }
}

// 4. DC갤러리 인기글
async function crawlDCGallery(galleryId, galleryName) {
  console.log(`💬 DC갤러리: ${galleryName}`);
  try {
    await randomDelay();
    const url = `https://gall.dcinside.com/board/lists/?id=${galleryId}&sort_type=W&exception_mode=recommend`;
    const res = await safeFetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': 'https://gall.dcinside.com/',
      }
    });
    const html = await res.text();

    // Parse table rows
    const results = [];
    const rowRe = /<tr class="ub-content[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRe.exec(html)) !== null && results.length < 5) {
      const row = rowMatch[1];
      // Title
      const titleMatch = row.match(/<a[^>]*href="([^"]*)"[^>]*class="[^"]*"[^>]*>([\s\S]*?)<\/a>/);
      if (!titleMatch) continue;
      const href = titleMatch[1];
      let title = stripHtml(titleMatch[2]).trim();
      if (!title || title.length < 3) continue;
      // Replies
      const replyMatch = row.match(/reply_num[^>]*>\[?(\d+)/);
      const replies = replyMatch ? parseInt(replyMatch[1]) : 0;
      // Recommends
      const recMatch = row.match(/<td class="gall_recommend"[^>]*>(\d+)/);
      const recommends = recMatch ? parseInt(recMatch[1]) : 0;

      const fullUrl = href.startsWith('http') ? href : `https://gall.dcinside.com${href}`;
      results.push({
        title,
        description: `${galleryName} 인기글 (댓글 ${replies}, 추천 ${recommends})`,
        sourceUrl: fullUrl,
        source: `DC ${galleryName}`,
        viralScore: Math.min(50 + replies * 2 + recommends * 3, 95)
      });
    }

    console.log(`  ✅ ${results.length}개`);
    return results;
  } catch (e) {
    console.error(`  ❌ DC ${galleryName} 실패:`, e.message);
    return [];
  }
}

// 5. Pet Food Industry (RSS 시도 → 실패 시 skip)
async function crawlPetFoodIndustry() {
  console.log(`🌍 Pet Food Industry`);
  try {
    const res = await safeFetch('https://www.petfoodindustry.com/rss', { headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' } });
    const xml = await res.text();
    const items = extractItems(xml);

    const results = items.slice(0, 3).map(item => {
      const title = stripHtml(extractTag(item, 'title'));
      const link = extractTag(item, 'link');
      const desc = stripHtml(extractTag(item, 'description')).substring(0, 200);
      return { title, description: desc || title, sourceUrl: link, source: 'Pet Food Industry' };
    }).filter(r => r.title);

    console.log(`  ✅ ${results.length}개`);
    return results;
  } catch (e) {
    console.error(`  ❌ Pet Food Industry 실패:`, e.message);
    return [];
  }
}

// ============================================================
// PROCESSING
// ============================================================

function categorize(title, desc) {
  const text = `${title} ${desc}`.toLowerCase();
  const issueKw = ['논란','위험','주의','경고','리콜','사고','사건','중독','사망','부작용','갈등','반대','우려','문제','충돌','피해','소송','controversy','recall','danger','warning','risk','ban'];
  const productKw = ['신제품','출시','런칭','서비스','브랜드','비교','리뷰','성분','효과','기능','테스트','product','launch','review','ingredient','formula','brand'];
  if (issueKw.some(k => text.includes(k))) return 'trend-issue';
  if (productKw.some(k => text.includes(k))) return 'trend-product';
  return 'trend-news';
}

function calcViralScore(source, title, desc) {
  const baseScores = {
    '데일리벳': 80, 'Pet Food Industry': 75, 'Google News': 70, 'Reddit': 65, 'DC': 60
  };
  let score = 55;
  for (const [key, val] of Object.entries(baseScores)) {
    if (source.includes(key)) { score = val; break; }
  }
  const hotKw = ['논란','위험','리콜','사망','중독','사건','신제품','출시','법률','정책','개정','recall','breaking','urgent'];
  const text = `${title} ${desc}`.toLowerCase();
  for (const kw of hotKw) { if (text.includes(kw)) score += 4; }
  return Math.min(score, 100);
}

function autoTags(title, desc) {
  const text = `${title} ${desc}`.toLowerCase();
  const map = {
    '사료': '사료', '영양': '영양', '병원': '의료', '법률': '정책', '정책': '정책',
    '안전': '안전', '위험': '위험', '신제품': '신제품', '연구': '연구', '시장': '시장',
    '건강': '건강', '예방': '예방', '질병': '질병', '치과': '치과', 'recall': '리콜',
    '강아지': '강아지', '고양이': '고양이'
  };
  const tags = new Set();
  for (const [kw, tag] of Object.entries(map)) { if (text.includes(kw)) tags.add(tag); }
  return [...tags].slice(0, 5);
}

function dedup(topics) {
  const seen = new Set();
  return topics.filter(t => {
    const key = t.title.substring(0, 20).toLowerCase().replace(/\s/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============================================================
// DATA MANAGEMENT
// ============================================================

function loadContentDb() {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'content-db.json'), 'utf8'));
}

function saveContentDb(data) {
  const src = path.join(DATA_DIR, 'content-db.json');
  const bak = path.join(DATA_DIR, 'content-db-backup.json');
  try { fs.copyFileSync(src, bak); } catch {}
  fs.writeFileSync(src, JSON.stringify(data, null, 2), 'utf8');
}

function removeOldTopics(data, cutoff) {
  const trend = data.categories.find(c => c.id === 'trend');
  if (!trend) return 0;
  let removed = 0;
  for (const sub of trend.subcategories) {
    const before = sub.topics.length;
    sub.topics = sub.topics.filter(t => {
      if (!/^(tn|ti|tp)-\d{8}-/.test(t.id)) return true; // keep manual
      return t.date && t.date >= cutoff;
    });
    removed += before - sub.topics.length;
  }
  return removed;
}

function saveTrendLog(entry) {
  const logPath = path.join(DATA_DIR, 'trend-log.json');
  let logs = [];
  try { logs = JSON.parse(fs.readFileSync(logPath, 'utf8')); } catch {}
  if (!Array.isArray(logs)) logs = [];
  logs.push(entry);
  logs = logs.slice(-60); // keep 60 days
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const today = new Date().toISOString().split('T')[0];
  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  console.log(`\n🤖 반려동물 트렌드 크롤링 v2 (${today})\n`);

  // 병렬 크롤링
  const sources = [
    { fn: () => crawlGoogleNews('반려동물 뉴스', '반려동물'), label: 'Google News (반려동물)' },
    { fn: () => crawlGoogleNews('강아지 사료 고양이 사료', '사료'), label: 'Google News (사료)' },
    { fn: () => crawlGoogleNews('펫푸드 트렌드 반려견 건강', '펫푸드'), label: 'Google News (펫푸드)' },
    { fn: () => crawlDailyvet(), label: '데일리벳' },
    { fn: () => crawlReddit('dogs'), label: 'Reddit r/dogs' },
    { fn: () => crawlReddit('cats'), label: 'Reddit r/cats' },
    { fn: () => crawlDCGallery('dog', '강아지갤'), label: 'DC 강아지갤' },
    { fn: () => crawlDCGallery('cat', '고양이갤'), label: 'DC 고양이갤' },
    { fn: () => crawlPetFoodIndustry(), label: 'Pet Food Industry' },
  ];

  console.log(`📡 ${sources.length}개 소스 크롤링 중...\n`);

  const results = await Promise.allSettled(sources.map(s => s.fn()));

  // 합산
  const all = [];
  const stats = {};
  results.forEach((r, i) => {
    const label = sources[i].label;
    if (r.status === 'fulfilled' && r.value.length > 0) {
      stats[label] = { ok: true, count: r.value.length };
      all.push(...r.value);
    } else {
      stats[label] = { ok: false, error: r.status === 'rejected' ? r.reason?.message : '0 results' };
    }
  });

  const unique = dedup(all);
  console.log(`\n📊 수집 ${all.length}개 → 중복제거 ${unique.length}개\n`);

  if (unique.length === 0) {
    console.log('⚠️ 수집 결과 없음');
    saveTrendLog({ date: today, stats, total: 0 });
    return;
  }

  // DB 업데이트
  const db = loadContentDb();
  const trend = db.categories.find(c => c.id === 'trend');
  if (!trend) { console.error('❌ trend 카테고리 없음'); return; }

  const added = { 'trend-news': 0, 'trend-issue': 0, 'trend-product': 0 };
  let counter = 1;

  for (const raw of unique) {
    const cat = categorize(raw.title, raw.description);
    const sub = trend.subcategories.find(s => s.id === cat);
    if (!sub) continue;

    // Skip if title already exists
    const exists = sub.topics.some(t =>
      t.title.substring(0, 20).toLowerCase() === raw.title.substring(0, 20).toLowerCase()
    );
    if (exists) continue;

    const prefix = cat === 'trend-news' ? 'tn' : cat === 'trend-issue' ? 'ti' : 'tp';
    const id = `${prefix}-${today.replace(/-/g, '')}-${String(counter++).padStart(3, '0')}`;

    sub.topics.push({
      id,
      title: raw.title,
      description: raw.description || '',
      source: raw.source || '',
      sourceUrl: raw.sourceUrl || '',
      date: today,
      viralScore: raw.viralScore || calcViralScore(raw.source || '', raw.title, raw.description || ''),
      tags: autoTags(raw.title, raw.description || ''),
      fullContent: '', easyContent: '', imagePrompts: []
    });
    added[cat]++;
  }

  const removedOld = removeOldTopics(db, cutoff);
  saveContentDb(db);

  const totalTrend = trend.subcategories.reduce((s, sub) => s + sub.topics.length, 0);

  // Log
  saveTrendLog({ date: today, timestamp: new Date().toISOString(), stats, crawled: all.length, unique: unique.length, added, removedOld, totalTrend });

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('📋 소스별 결과:');
  for (const [src, s] of Object.entries(stats)) {
    console.log(s.ok ? `  ✅ ${src}: ${s.count}개` : `  ❌ ${src}: ${s.error}`);
  }
  console.log('\n📈 추가:');
  console.log(`  📰 업계뉴스: +${added['trend-news']}`);
  console.log(`  🚨 이슈/논란: +${added['trend-issue']}`);
  console.log(`  📦 제품/서비스: +${added['trend-product']}`);
  console.log(`  🗑️ 7일 지난 항목 삭제: ${removedOld}개`);
  console.log(`  📊 총 트렌드: ${totalTrend}개`);
  console.log('═══════════════════════════════════════');

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ date: today, stats, added, removedOld, totalTrend }, null, 2));
  }
}

main().catch(e => { console.error('❌ 크롤링 실패:', e.message); process.exit(1); });

export default main;
