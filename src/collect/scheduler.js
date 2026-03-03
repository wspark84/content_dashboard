import { collectGangsamo } from './gangsamo.js';
import { collectGodahang } from './godahang.js';
import { collectDcGallery } from './dcgallery.js';
import { collectNaverNews } from './naver-news.js';
import { collectReddit } from './reddit.js';
import { closeDb } from '../shared/db.js';

const collectors = [
  { name: 'gangsamo', fn: collectGangsamo },
  { name: 'godahang', fn: collectGodahang },
  { name: 'dcgallery', fn: collectDcGallery },
  { name: 'naver-news', fn: collectNaverNews },
  { name: 'reddit', fn: collectReddit },
];

async function runAll() {
  console.log('=== Scheduler: Starting all collectors ===');
  const results = {};
  for (const { name, fn } of collectors) {
    try {
      const posts = await fn();
      results[name] = { ok: true, count: posts.length };
    } catch (e) {
      console.error(`[scheduler] ${name} ERROR: ${e.message}`);
      results[name] = { ok: false, error: e.message };
    }
  }
  closeDb();
  console.log('\n=== Scheduler: Summary ===');
  for (const [name, r] of Object.entries(results)) {
    console.log(`  ${r.ok ? '✅' : '❌'} ${name}: ${r.ok ? r.count + ' posts' : r.error}`);
  }
  return results;
}

runAll().catch(e => { console.error(e); process.exit(1); });
