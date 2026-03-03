/**
 * 네이버 블로그 발행 모듈
 * Puppeteer로 네이버 블로그 에디터에 접속하여 콘텐츠를 발행한다.
 * innerHTML 방식 금지 — 분할 타이핑 + clipboard paste 방식 사용.
 */

import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { getDb } from '../shared/db.js';
import { config } from '../shared/config.js';


const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = resolve(__dirname, '../../screenshots');

// 상수
const CHUNK_SIZE = 200;
const CHUNK_DELAY_MIN = 300;
const CHUNK_DELAY_MAX = 600;
const SELECTOR_TIMEOUT = 90000;
const PAGE_LOAD_TIMEOUT = 120000;
const MAX_RETRIES = 3;

const BLOG_ID = config.blog?.id || config.blog?.username || 'lifelogics';

// ===== 유틸리티 =====

function randomDelay(min = 1000, max = 3000) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(r => setTimeout(r, ms));
}

function randomUserAgent() {
  const agents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

function randomViewport() {
  const sizes = [[1440, 900], [1536, 864], [1920, 1080]];
  const [width, height] = sizes[Math.floor(Math.random() * sizes.length)];
  return { width, height };
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ===== 브라우저 관리 =====

async function launchBrowser() {
  const viewport = randomViewport();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      `--window-size=${viewport.width},${viewport.height}`,
    ],
    defaultViewport: viewport,
  });
  const page = await browser.newPage();
  await page.setUserAgent(randomUserAgent());
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9' });
  return { browser, page };
}

// ===== 네이버 로그인 =====

async function naverLogin(page) {
  console.log('🔑 네이버 로그인 시도...');
  await page.goto('https://nid.naver.com/nidlogin.login', {
    waitUntil: 'networkidle2',
    timeout: PAGE_LOAD_TIMEOUT,
  });
  await randomDelay(1000, 2000);

  const username = config.blog?.username || process.env.NAVER_USERNAME || process.env.NAVER_ID;
  const password = config.blog?.password || process.env.NAVER_PASSWORD || process.env.NAVER_PW;

  if (!username || !password) {
    throw new Error('네이버 로그인 정보 없음 (NAVER_USERNAME, NAVER_PASSWORD)');
  }

  // 클립보드 방식으로 ID/PW 입력 (타이핑 감지 우회)
  await page.evaluate((id, pw) => {
    document.querySelector('#id').value = id;
    document.querySelector('#pw').value = pw;
  }, username, password);
  await randomDelay(500, 1000);

  await page.click('.btn_login');
  await randomDelay(3000, 5000);

  // 로그인 확인
  const currentUrl = page.url();
  if (currentUrl.includes('nidlogin')) {
    throw new Error('네이버 로그인 실패 — 캡차 또는 2FA 필요할 수 있음');
  }
  console.log('✅ 네이버 로그인 성공');
}

// ===== 에디터 열기 =====

async function openEditor(page) {
  const editorUrl = `https://blog.naver.com/${BLOG_ID}/postwrite`;
  console.log(`📝 에디터 접속: ${editorUrl}`);
  await page.goto(editorUrl, {
    waitUntil: 'networkidle2',
    timeout: PAGE_LOAD_TIMEOUT,
  });
  await randomDelay(2000, 4000);

  // SE 에디터 로드 대기
  await page.waitForSelector('.se-component-content', { timeout: SELECTOR_TIMEOUT });
  console.log('✅ 에디터 로드 완료');
}

// ===== 제목 입력 =====

async function inputTitle(page, title) {
  console.log(`📌 제목 입력: ${title.substring(0, 50)}...`);
  const titleSelector = '.se-documentTitle .se-text-paragraph';
  await page.waitForSelector(titleSelector, { timeout: SELECTOR_TIMEOUT });
  await page.click(titleSelector);
  await randomDelay(300, 600);
  await page.keyboard.type(title, { delay: 30 });
  await randomDelay(500, 1000);
}

// ===== 본문 입력 (분할 타이핑) =====

async function inputBody(page, body) {
  const plainText = body.includes('<') ? stripHtml(body) : body;
  console.log(`📝 본문 입력 (${plainText.length}자)...`);

  // 본문 영역 클릭
  const bodySelector = '.se-component-content .se-text-paragraph';
  await page.click(bodySelector);
  await randomDelay(500, 800);

  // 문단 단위로 분할
  const paragraphs = plainText.split(/\n{2,}/);

  for (let pi = 0; pi < paragraphs.length; pi++) {
    const para = paragraphs[pi].trim();
    if (!para) {
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      continue;
    }

    // 각 문단을 CHUNK_SIZE 단위로 분할 타이핑
    const chunks = para.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'gs')) || [para];
    for (const chunk of chunks) {
      let success = false;
      for (let retry = 0; retry < MAX_RETRIES; retry++) {
        try {
          await page.keyboard.type(chunk, { delay: 5 });
          success = true;
          break;
        } catch (err) {
          console.warn(`⚠️ 타이핑 재시도 ${retry + 1}/${MAX_RETRIES}`);
          await randomDelay(1000, 2000);
        }
      }
      if (!success) throw new Error('본문 타이핑 실패');
      await randomDelay(CHUNK_DELAY_MIN, CHUNK_DELAY_MAX);
    }

    // 문단 사이 엔터
    if (pi < paragraphs.length - 1) {
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      await randomDelay(200, 400);
    }
  }

  console.log('✅ 본문 입력 완료');
}

// ===== 이미지 업로드 =====

async function uploadImages(page, imagesJson) {
  if (!imagesJson) return;

  let images;
  try {
    images = JSON.parse(imagesJson);
  } catch {
    return;
  }

  if (!Array.isArray(images) || images.length === 0) return;

  console.log(`🖼️ 이미지 ${images.length}개 업로드...`);

  for (const imgPath of images) {
    const absPath = resolve(config.root || __dirname, imgPath);
    if (!existsSync(absPath)) {
      console.warn(`⚠️ 이미지 없음: ${absPath}`);
      continue;
    }

    // 이미지 버튼 클릭
    try {
      const imageBtn = await page.$('.se-toolbar-button-image, [data-name="image"]');
      if (imageBtn) {
        await imageBtn.click();
        await randomDelay(1000, 2000);

        // 파일 입력
        const fileInput = await page.$('input[type="file"][accept*="image"]');
        if (fileInput) {
          await fileInput.uploadFile(absPath);
          await randomDelay(3000, 5000);
          console.log(`  ✅ 업로드: ${imgPath}`);
        }
      }
    } catch (err) {
      console.warn(`  ⚠️ 이미지 업로드 실패: ${err.message}`);
    }
  }
}

// ===== 발행 =====

async function clickPublish(page) {
  console.log('🚀 발행 버튼 클릭...');

  // "발행" 버튼
  const publishBtn = await page.waitForSelector(
    '.publish_btn__m9KHH, button.se-publish-btn, .btn_publish',
    { timeout: SELECTOR_TIMEOUT }
  );
  await publishBtn.click();
  await randomDelay(2000, 3000);

  // 확인 버튼 (발행 팝업)
  const confirmBtn = await page.waitForSelector(
    '.publish_btn__m9KHH.confirm, .btn_ok, button[data-testid="publish-confirm"]',
    { timeout: SELECTOR_TIMEOUT }
  ).catch(() => null);

  if (confirmBtn) {
    await confirmBtn.click();
    await randomDelay(3000, 5000);
  }

  // 발행 후 URL 추출
  const publishedUrl = page.url();
  console.log(`✅ 발행 완료: ${publishedUrl}`);
  return publishedUrl;
}

// ===== 메인 발행 함수 =====

/**
 * 네이버 블로그에 콘텐츠를 발행한다.
 * @param {number} contentId - contents 테이블의 id
 * @param {object} options - { dryRun: boolean }
 * @returns {{ success: boolean, url?: string, error?: string }}
 */
export async function publishToNaverBlog(contentId, options = {}) {
  const { dryRun = false } = options;
  const db = getDb();

  // 콘텐츠 조회
  const content = db.prepare(
    `SELECT * FROM contents WHERE id = ? AND status = 'approved' AND type IN ('blog_expert', 'blog_general')`
  ).get(contentId);

  if (!content) {
    return { success: false, error: `콘텐츠 ${contentId} 없음 또는 발행 불가 상태` };
  }

  console.log(`\n📋 발행 대상: [${content.type}] ${content.title}`);

  if (dryRun) {
    console.log('🏃 DRY-RUN 모드 — 실제 발행 건너뜀');
    return { success: true, url: `https://blog.naver.com/${BLOG_ID}/dry-run-${contentId}`, dryRun: true };
  }

  let browser, page;
  try {
    ({ browser, page } = await launchBrowser());
    await naverLogin(page);
    await openEditor(page);
    await inputTitle(page, content.title);
    await inputBody(page, content.html || content.body);
    await uploadImages(page, content.images);
    const url = await clickPublish(page);

    // DB 업데이트
    db.prepare(
      `UPDATE contents SET status = 'published', published_url = ?, published_at = datetime('now') WHERE id = ?`
    ).run(url, contentId);

    return { success: true, url };
  } catch (err) {
    console.error(`❌ 발행 실패: ${err.message}`);
    return { success: false, error: err.message };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

export default publishToNaverBlog;
