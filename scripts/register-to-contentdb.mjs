#!/usr/bin/env node
/**
 * 콘텐츠DB 중앙 허브 — 토픽 자동 등록
 * 
 * 사용법:
 *   node register-to-contentdb.mjs --title "제목" --desc "설명" --source "출처" --animal dog|cat|both --tags "태그1,태그2"
 *   node register-to-contentdb.mjs --from-cardnews "/path/to/캡션.txt"
 *   node register-to-contentdb.mjs --from-blog "/path/to/blog-post.json"
 * 
 * 카드뉴스 제작, 블로그 발행, 트렌드 크롤링 후 자동 호출됨
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'content-db.json');
const STANDALONE_PATH = '/Users/wspark/.openclaw/workspace/unified-dashboard/.next/standalone/pet-content-dashboard/data/content-db.json';

const DOG_KW = /강아지|개\s|견종|반려견|퍼피|puppy|dog/i;
const CAT_KW = /고양이|묘|캣|반려묘|냥이|cat|kitten/i;
const ISSUE_KW = /논란|위험|주의|경고|리콜|사고|사건|중독|사망|부작용|갈등|반대|금지|독|피해|치명/;
const PRODUCT_KW = /신제품|출시|런칭|브랜드|리뷰|성분|효과|기능|서비스/;

function detectAnimal(text) {
  const hasDog = DOG_KW.test(text);
  const hasCat = CAT_KW.test(text);
  if (hasDog && hasCat) return 'both';
  if (hasDog) return 'dog';
  if (hasCat) return 'cat';
  return 'both';
}

function detectSubcategory(title, desc) {
  const text = `${title} ${desc}`;
  if (ISSUE_KW.test(text)) return 'trend-issue';
  if (PRODUCT_KW.test(text)) return 'trend-product';
  return 'trend-news';
}

function calcViralScore(title, desc, source) {
  let score = 75;
  const hot = /논란|위험|리콜|사망|중독|사건|세금|지원금|정책|법률|AI|ChatGPT|세계 최초/;
  if (hot.test(`${title} ${desc}`)) score += 10;
  if (source && (source.includes('Fortune') || source.includes('연합') || source.includes('매일경제'))) score += 5;
  return Math.min(score, 99);
}

function generateId(prefix = 'tn') {
  return `${prefix}-${Date.now().toString(36)}`;
}

// ━━━ 카드뉴스 캡션 파일에서 자동 파싱 ━━━
function parseCardnewsCaption(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split('\n').filter(l => l.trim());
  
  const title = lines[0] || '';
  // 본문에서 description 추출 (해시태그 전까지)
  const hashIdx = text.indexOf('#');
  const body = hashIdx > 0 ? text.substring(title.length, hashIdx).trim() : lines.slice(1, 4).join(' ');
  const desc = body.replace(/\n/g, ' ').substring(0, 150).trim();
  
  // 해시태그 → 태그
  const tagMatch = text.match(/#\S+/g) || [];
  const tags = tagMatch.map(t => t.replace('#', '')).slice(0, 8);
  
  // 출처
  const sourceMatch = text.match(/출처:\s*(.+)/);
  const source = sourceMatch ? sourceMatch[1].trim() : '독박집사 카드뉴스';
  
  return { title, description: desc, tags, source, animal: detectAnimal(`${title} ${body}`) };
}

// ━━━ DB에 등록 ━━━
function registerTopic(topic) {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  
  const subId = topic.subcategoryId || detectSubcategory(topic.title, topic.description);
  
  // 트렌드분석 카테고리 찾기
  let trendCat = db.categories.find(c => c.id === 'trend');
  if (!trendCat) {
    console.error('❌ 트렌드분석 카테고리 없음');
    return false;
  }
  
  let subcat = trendCat.subcategories.find(s => s.id === subId);
  if (!subcat) subcat = trendCat.subcategories[0]; // fallback: 업계 뉴스
  
  // 중복 체크 (제목 앞 15자 기준)
  const titlePrefix = topic.title.substring(0, 15);
  const exists = subcat.topics.some(t => t.title.substring(0, 15) === titlePrefix);
  if (exists) {
    console.log(`⏭️ 이미 존재: ${topic.title.substring(0, 40)}`);
    return false;
  }
  
  const newTopic = {
    id: topic.id || generateId(),
    title: topic.title,
    description: topic.description,
    tags: topic.tags || [],
    animal: topic.animal || 'both',
    difficulty: topic.difficulty || 'basic',
    viralScore: topic.viralScore || calcViralScore(topic.title, topic.description, topic.source),
    source: topic.source || '',
    crawledAt: new Date().toISOString().split('T')[0]
  };
  
  subcat.topics.push(newTopic);
  
  // 저장
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  
  // standalone 동기화
  try {
    fs.copyFileSync(DB_PATH, STANDALONE_PATH);
  } catch (e) {
    console.log(`⚠️ standalone 동기화 실패: ${e.message}`);
  }
  
  console.log(`✅ 등록: [${subcat.name}] ${newTopic.title.substring(0, 50)} (viral: ${newTopic.viralScore})`);
  return true;
}

// ━━━ CLI ━━━
const args = process.argv.slice(2);

if (args.includes('--from-cardnews')) {
  const idx = args.indexOf('--from-cardnews');
  const filePath = args[idx + 1];
  if (!filePath || !fs.existsSync(filePath)) {
    console.error('❌ 캡션 파일 경로 필요: --from-cardnews /path/to/캡션.txt');
    process.exit(1);
  }
  const topic = parseCardnewsCaption(filePath);
  registerTopic(topic);
  
} else if (args.includes('--title')) {
  const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : ''; };
  registerTopic({
    title: get('--title'),
    description: get('--desc') || get('--title'),
    source: get('--source') || '',
    animal: get('--animal') || 'both',
    tags: (get('--tags') || '').split(',').filter(Boolean),
    viralScore: parseInt(get('--viral')) || undefined
  });
  
} else {
  console.log(`
콘텐츠DB 중앙 허브 — 토픽 등록

사용법:
  # 카드뉴스 캡션에서 자동 등록
  node register-to-contentdb.mjs --from-cardnews "캡션.txt"

  # 수동 등록
  node register-to-contentdb.mjs --title "제목" --desc "설명" --source "출처" --animal dog --tags "태그1,태그2" --viral 90
  `);
}

export { registerTopic, parseCardnewsCaption };
