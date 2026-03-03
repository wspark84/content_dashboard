import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
const html = readFileSync('/tmp/naver_news.html', 'utf8');
const $ = cheerio.load(html);
const links = [];
$('a').each((i, el) => {
  const href = $(el).attr('href') || '';
  const t = $(el).text().trim();
  if (href.includes('news.naver.com') && t.length > 10) {
    links.push({ text: t.slice(0,80), href: href.slice(0,80) });
  }
});
console.log(JSON.stringify(links.slice(0,8), null, 2));
