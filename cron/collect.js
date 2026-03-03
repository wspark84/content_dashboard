/**
 * 08:00 수집 크론잡 — scheduler.js 래핑
 * 사용: node cron/collect.js
 * 크론탭: 0 8 * * * cd /path/to/mungnyang-viral && node cron/collect.js >> logs/collect.log 2>&1
 */

const start = Date.now();
const ts = () => new Date().toISOString();

console.log(`\n${'='.repeat(50)}`);
console.log(`🕗 [${ts()}] 수집 크론잡 시작`);
console.log(`${'='.repeat(50)}`);

try {
  // Dynamic import to avoid top-level side effects
  const { collectGangsamo } = await import('../src/collect/gangsamo.js');
  const { collectGodahang } = await import('../src/collect/godahang.js');
  const { collectDcGallery } = await import('../src/collect/dcgallery.js');
  const { collectNaverNews } = await import('../src/collect/naver-news.js');
  const { collectReddit } = await import('../src/collect/reddit.js');
  const { closeDb } = await import('../src/shared/db.js');

  const collectors = [
    { name: 'gangsamo', fn: collectGangsamo },
    { name: 'godahang', fn: collectGodahang },
    { name: 'dcgallery', fn: collectDcGallery },
    { name: 'naver-news', fn: collectNaverNews },
    { name: 'reddit', fn: collectReddit },
  ];

  const results = {};
  for (const { name, fn } of collectors) {
    try {
      const posts = await fn();
      results[name] = { ok: true, count: posts.length };
    } catch (e) {
      console.error(`[collect] ${name} ERROR: ${e.message}`);
      results[name] = { ok: false, error: e.message };
    }
  }

  closeDb();

  // 결과 요약
  console.log(`\n📊 수집 결과 요약:`);
  let totalPosts = 0;
  let failures = 0;
  for (const [name, r] of Object.entries(results)) {
    const icon = r.ok ? '✅' : '❌';
    console.log(`  ${icon} ${name}: ${r.ok ? r.count + '건' : r.error}`);
    if (r.ok) totalPosts += r.count;
    else failures++;
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n⏱️ 소요시간: ${elapsed}초 | 수집: ${totalPosts}건 | 실패: ${failures}개`);
  console.log(`✅ [${ts()}] 수집 크론잡 완료\n`);

} catch (e) {
  console.error(`❌ [${ts()}] 크론잡 치명적 오류:`, e);
  process.exit(1);
}
