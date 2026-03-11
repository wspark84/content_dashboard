#!/usr/bin/env node
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

const NAVER_ID = process.env.NAVER_ID;
const NAVER_PW = process.env.NAVER_PW;

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

  // 로그인
  console.log('로그인...');
  await page.goto('https://nid.naver.com/nidlogin.login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate((id, pw) => {
    document.querySelector('#id').value = id;
    document.querySelector('#pw').value = pw;
    document.querySelector('#id').dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#pw').dispatchEvent(new Event('input', { bubbles: true }));
  }, NAVER_ID, NAVER_PW);
  await new Promise(r => setTimeout(r, 1000));
  await page.click('#log\\.login');
  await new Promise(r => setTimeout(r, 4000));
  console.log('로그인 후 URL:', page.url());

  // 강사모 카페 접속 (모바일)
  console.log('\n--- 강사모 모바일 접속 ---');
  await page.goto('https://m.cafe.naver.com/dogpalza', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  console.log('URL:', page.url());
  
  // 페이지 구조 확인
  const mobileContent = await page.evaluate(() => {
    // 모든 a 태그 중 article 관련 찾기
    const links = document.querySelectorAll('a');
    const articleLinks = [];
    for (const a of links) {
      const href = a.href || '';
      const text = (a.textContent || '').trim().substring(0, 60);
      if ((href.includes('/articles/') || href.includes('articleid')) && text.length > 5) {
        articleLinks.push({ text, href: href.substring(0, 100) });
      }
    }
    return {
      title: document.title,
      articleLinks: articleLinks.slice(0, 10),
      bodyTextSample: document.body?.textContent?.substring(0, 500) || ''
    };
  });
  
  console.log('Title:', mobileContent.title);
  console.log('Article links:', JSON.stringify(mobileContent.articleLinks, null, 2));
  console.log('Body sample:', mobileContent.bodyTextSample.substring(0, 300));

  // PC 버전도 시도
  console.log('\n--- 강사모 PC 접속 ---');
  await page.goto('https://cafe.naver.com/dogpalza', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  
  // iframe 확인
  const frameUrls = page.frames().map(f => f.url());
  console.log('Frames:', frameUrls);
  
  // 메인 iframe에서 게시글 추출
  for (const frame of page.frames()) {
    if (frame.url().includes('cafe.naver.com') && frame !== page.mainFrame()) {
      try {
        const posts = await frame.evaluate(() => {
          const results = [];
          // 다양한 셀렉터 시도
          const selectors = [
            '.article-board .td_article a.article',
            '.board-list .inner_list a',
            'a.article',
            '.article_lst a',
            '.board_box a.tit',
          ];
          for (const sel of selectors) {
            const els = document.querySelectorAll(sel);
            if (els.length > 0) {
              for (const el of Array.from(els).slice(0, 5)) {
                results.push({ sel, text: (el.textContent || '').trim().substring(0, 60), href: (el.href || '').substring(0, 80) });
              }
              break;
            }
          }
          return results;
        });
        console.log('Frame posts:', JSON.stringify(posts, null, 2));
      } catch (e) {
        console.log('Frame error:', e.message);
      }
    }
  }

  // 네이버 카페 내부 API 직접 fetch
  console.log('\n--- API 직접 fetch ---');
  const apis = [
    `https://apis.naver.com/cafe-web/cafe2/ArticleList.json?search.clubUrl=dogpalza&search.page=1&search.perPage=10&search.boardType=L`,
    `https://apis.naver.com/cafe-web/cafe-mobile/CafeMobileWebArticleSearchListV3?cafeUrl=dogpalza&page=1&perPage=10`,
    `https://cafe.naver.com/ArticleSearchList.nhn?search.clubUrl=dogpalza&search.searchdate=all&search.page=1`,
  ];
  
  for (const api of apis) {
    try {
      const result = await page.evaluate(async (url) => {
        try {
          const res = await fetch(url, { credentials: 'include' });
          const text = await res.text();
          return { status: res.status, body: text.substring(0, 500) };
        } catch (e) { return { error: e.message }; }
      }, api);
      console.log(`\nAPI: ${api.substring(0, 80)}...`);
      console.log('Result:', JSON.stringify(result).substring(0, 300));
    } catch (e) {
      console.log('Error:', e.message);
    }
  }

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
