#!/usr/bin/env node
/**
 * 네이버 카페 크롤러 — Puppeteer + Stealth 로그인 기반
 * 모바일 + PC iframe 이중 방식
 */
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

puppeteer.use(StealthPlugin());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'cafe-monitor.json');

const NAVER_ID = process.env.NAVER_ID;
const NAVER_PW = process.env.NAVER_PW;

const CAFES = [
  { id: 'dogpalza', name: '강사모', animal: '강아지', url: 'https://cafe.naver.com/dogpalza' },
  { id: 'arabichon', name: '아라뱃길비숑', animal: '강아지', url: 'https://cafe.naver.com/arabichon' },
  { id: 'ilovecat', name: '고다행', animal: '고양이', url: 'https://cafe.naver.com/ilovecat' },
  { id: 'clubpet', name: '냥이네', animal: '고양이', url: 'https://cafe.naver.com/clubpet' },
];

function delay(min = 1500, max = 3500) {
  return new Promise(r => setTimeout(r, Math.floor(Math.random() * (max - min + 1)) + min));
}

async function login(page) {
  console.log('🔐 네이버 로그인...');
  await page.goto('https://nid.naver.com/nidlogin.login', { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(1000, 2000);
  await page.evaluate((id, pw) => {
    document.querySelector('#id').value = id;
    document.querySelector('#pw').value = pw;
    document.querySelector('#id').dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#pw').dispatchEvent(new Event('input', { bubbles: true }));
  }, NAVER_ID, NAVER_PW);
  await delay(500, 1000);
  await page.click('#log\\.login');
  await delay(4000, 6000);
  
  // 기기 등록 페이지 등 처리
  if (page.url().includes('deviceConfirm')) {
    console.log('  ⚠️ 기기 등록 페이지 — 건너뛰기 시도');
    try {
      await page.goto('https://www.naver.com', { waitUntil: 'networkidle2', timeout: 15000 });
      await delay(1000, 2000);
    } catch {}
  }
  
  console.log('✅ 로그인 완료');
}

async function crawlCafeMobile(page, cafe) {
  console.log(`\n📱 모바일 크롤링: ${cafe.name}...`);
  const articles = [];
  
  await page.goto(`https://m.cafe.naver.com/${cafe.id}`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000, 3000);
  
  // 모바일 페이지에서 게시글 링크 추출
  const posts = await page.evaluate(() => {
    const links = document.querySelectorAll('a');
    const results = [];
    for (const a of links) {
      const href = a.href || '';
      const text = (a.textContent || '').trim();
      if (href.includes('ArticleRead') && text.length > 5) {
        // 제목과 메타데이터 파싱
        const parts = text.split(/\s{2,}/);
        const title = parts[0] || text;
        
        // articleid 추출
        const aidMatch = href.match(/articleid=(\d+)/i);
        const aid = aidMatch ? aidMatch[1] : '';
        
        // 조회수 추출
        const viewMatch = text.match(/조회\s+([\d,.]+[만천]?)/);
        let views = 0;
        if (viewMatch) {
          let v = viewMatch[1];
          if (v.includes('만')) views = parseFloat(v) * 10000;
          else if (v.includes('천')) views = parseFloat(v) * 1000;
          else views = parseInt(v.replace(/,/g, ''));
        }
        
        // 날짜 추출 (YYYY.MM.DD 또는 MM.DD. 또는 N시간전/N분전/어제/HH:MM)
        const dateMatch = text.match(/(\d{4}\.\d{2}\.\d{2})/);
        const shortDateMatch = text.match(/(\d{2})\.(\d{2})\.(?!\d)/);
        const timeMatch = text.match(/(\d+시간\s*전|\d+분\s*전)/);
        const yesterdayMatch = text.match(/어제/);
        const timeOnlyMatch = text.match(/(?:^|\s)(\d{1,2}:\d{2})(?:\s|$)/);
        let date = '';
        if (dateMatch) date = dateMatch[1];
        else if (shortDateMatch) date = new Date().getFullYear() + '.' + shortDateMatch[1] + '.' + shortDateMatch[2];
        else if (timeMatch) date = timeMatch[1];
        else if (yesterdayMatch) {
          const y = new Date(Date.now() - 86400000);
          date = y.getFullYear() + '.' + String(y.getMonth()+1).padStart(2,'0') + '.' + String(y.getDate()).padStart(2,'0');
        } else if (timeOnlyMatch) {
          // HH:MM만 있으면 오늘 날짜로 처리
          const now = new Date();
          date = now.getFullYear() + '.' + String(now.getMonth()+1).padStart(2,'0') + '.' + String(now.getDate()).padStart(2,'0');
        }
        
        // 작성자 추출 (제목 뒤 첫 번째 짧은 텍스트, 시간값은 제외)
        let authorMatch = parts.length > 1 ? parts[1] : '';
        // HH:MM 패턴이 작성자로 잡힌 경우 다음 파트 사용
        if (/^\d{1,2}:\d{2}$/.test(authorMatch.trim()) && parts.length > 2) {
          authorMatch = parts[2];
        }
        
        results.push({
          title: title.substring(0, 100),
          articleId: aid,
          href,
          views,
          date,
          author: authorMatch.substring(0, 20)
        });
      }
    }
    return results;
  });
  
  // 중복 제거 (articleId 기준)
  const seen = new Set();
  for (const p of posts) {
    if (p.articleId && !seen.has(p.articleId)) {
      seen.add(p.articleId);
      articles.push({
        title: p.title,
        articleId: p.articleId,
        link: p.href,
        views: p.views,
        date: p.date,
        author: p.author,
        crawledAt: new Date().toISOString()
      });
    }
  }
  
  return articles;
}

async function crawlCafePC(page, cafe) {
  console.log(`  🖥️ PC iframe 크롤링: ${cafe.name}...`);
  const articles = [];
  
  await page.goto(`https://cafe.naver.com/${cafe.id}`, { waitUntil: 'networkidle2', timeout: 30000 });
  await delay(2000, 3000);
  
  // iframe 찾기
  for (const frame of page.frames()) {
    if (frame.url().includes('cafe.naver.com') && frame !== page.mainFrame() && !frame.url().includes('cyber.go.kr')) {
      try {
        const posts = await frame.evaluate(() => {
          const results = [];
          const els = document.querySelectorAll('.article-board .td_article a.article');
          for (const el of els) {
            const href = el.href || '';
            const title = (el.textContent || '').trim();
            const aidMatch = href.match(/articleid=(\d+)/i);
            
            // 조회수 — 같은 행의 td_view
            const row = el.closest('tr');
            const viewEl = row?.querySelector('.td_view');
            const views = viewEl ? parseInt((viewEl.textContent || '0').replace(/,/g, '')) : 0;
            
            // 작성자
            const authorEl = row?.querySelector('.td_name .p-nick a');
            const author = authorEl ? (authorEl.textContent || '').trim() : '';
            
            // 날짜 (PC: "03.17." 또는 "2026.03.17" 형식)
            const dateEl = row?.querySelector('.td_date');
            let date = dateEl ? (dateEl.textContent || '').trim() : '';
            // 짧은 형식 "03.17." → 올해 기준 "2026.03.17"로 변환
            const shortDate = date.match(/^(\d{2})\.(\d{2})\.?$/);
            if (shortDate) {
              date = new Date().getFullYear() + '.' + shortDate[1] + '.' + shortDate[2];
            }
            
            if (title.length > 3) {
              results.push({
                title: title.substring(0, 100),
                articleId: aidMatch ? aidMatch[1] : '',
                href,
                views,
                author,
                date
              });
            }
          }
          return results;
        });
        
        for (const p of posts) {
          articles.push({
            title: p.title,
            articleId: p.articleId,
            link: p.href,
            views: p.views,
            date: p.date,
            author: p.author,
            crawledAt: new Date().toISOString()
          });
        }
        
        if (articles.length > 0) break;
      } catch {}
    }
  }
  
  return articles;
}

async function crawlCafe(page, cafe) {
  // 1차: 모바일
  let articles = await crawlCafeMobile(page, cafe);
  
  // 2차: 모바일 결과 부족하면 PC iframe
  if (articles.length < 5) {
    const pcArticles = await crawlCafePC(page, cafe);
    // 합치기 (중복 제거)
    const existingIds = new Set(articles.map(a => a.articleId));
    for (const a of pcArticles) {
      if (a.articleId && !existingIds.has(a.articleId)) {
        articles.push(a);
        existingIds.add(a.articleId);
      }
    }
  }
  
  console.log(`  ✅ ${articles.length}개 수집`);
  return articles;
}

async function main() {
  if (!NAVER_ID || !NAVER_PW) {
    console.error('❌ NAVER_ID, NAVER_PW 환경변수 필요');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    await login(page);

    const results = { lastCrawled: new Date().toISOString(), cafes: {} };

    for (const cafe of CAFES) {
      const articles = await crawlCafe(page, cafe);
      results.cafes[cafe.id] = {
        name: cafe.name,
        animal: cafe.animal,
        url: cafe.url,
        articleCount: articles.length,
        articles,
        lastCrawled: new Date().toISOString()
      };
      await delay(2000, 4000);
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log(`\n💾 저장: ${OUTPUT_FILE}`);
    console.log('\n📊 결과:');
    for (const [id, info] of Object.entries(results.cafes)) {
      console.log(`  ${info.name}: ${info.articleCount}개`);
      if (info.articles.length > 0) {
        console.log(`    최신: ${info.articles[0].title}`);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });
