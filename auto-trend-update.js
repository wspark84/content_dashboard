#!/usr/bin/env node
/**
 * 자동 트렌드 업데이트 크론잡 스크립트
 * openclaw cron으로 매일 오전 8시 실행
 * Brave Search API를 통해 최신 반려동물 뉴스 수집 → content-db.json 업데이트
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'content-db.json');
const LOG_PATH = path.join(__dirname, 'data', 'trend-update-log.json');

async function main() {
  console.log(`[${new Date().toISOString()}] 트렌드 자동 업데이트 시작`);
  
  try {
    // inject-trends.js 실행 (수동으로 데이터 갱신 시 사용)
    // 실제 자동화는 openclaw의 web_search를 통해 하트비트에서 처리
    execSync('node ' + path.join(__dirname, 'inject-trends.js'), { stdio: 'inherit' });
    
    const log = {
      lastUpdate: new Date().toISOString(),
      status: 'success',
      method: 'cron'
    };
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
    
    console.log('✅ 트렌드 업데이트 완료');
  } catch (e) {
    console.error('❌ 트렌드 업데이트 실패:', e.message);
    const log = {
      lastUpdate: new Date().toISOString(),
      status: 'error',
      error: e.message
    };
    fs.writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
  }
}

main();
