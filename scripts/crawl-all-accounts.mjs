#!/usr/bin/env node
/**
 * 전체 계정 성과 크롤링 스크립트
 * - 네이버 블로그: m.blog.naver.com API (글 수, 좋아요, 댓글, 공유)
 * - 유튜브: YouTube Data API v3
 * - 인스타그램: 수동 입력 (API 제한)
 * 
 * 결과: data/performance-snapshot.json (일별 스냅샷 + 히스토리)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

function fetchText(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' };
    https.get(url, { headers: { ...defaultHeaders, ...headers } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject);
  });
}

async function fetchJSON(url, headers = {}) {
  const text = await fetchText(url, headers);
  return JSON.parse(text);
}

// ===== 네이버 블로그 크롤링 =====
async function crawlNaverBlog(blogId) {
  console.log(`📗 네이버 블로그 크롤링: ${blogId}`);
  
  let totalPosts = 0, totalComments = 0, totalLikes = 0, totalShares = 0;
  const recentPosts = [];
  const headers = { 'Referer': `https://m.blog.naver.com/${blogId}` };
  
  let page = 1;
  while (true) {
    try {
      const url = `https://m.blog.naver.com/api/blogs/${blogId}/post-list?categoryNo=0&itemCount=30&page=${page}`;
      const json = await fetchJSON(url, headers);
      const items = json.result?.items || [];
      if (items.length === 0) break;
      
      for (const item of items) {
        totalPosts++;
        totalComments += item.commentCnt || 0;
        totalLikes += item.sympathyCnt || 0;
        totalShares += item.shareCnt || 0;
        
        if (recentPosts.length < 15) {
          recentPosts.push({
            id: String(item.logNo),
            title: item.titleWithInspectMessage || '',
            url: `https://blog.naver.com/${blogId}/${item.logNo}`,
            views: 0, // 비로그인 시 조회수 미제공
            likes: item.sympathyCnt || 0,
            comments: item.commentCnt || 0,
            shares: item.shareCnt || 0,
            date: item.addDate ? new Date(item.addDate).toISOString().split('T')[0] : ''
          });
        }
      }
      
      if (items.length < 30) break;
      page++;
      await new Promise(r => setTimeout(r, 200));
    } catch(e) {
      console.error(`  Page ${page} 실패:`, e.message);
      break;
    }
  }
  
  console.log(`  ✅ 총 ${totalPosts}개 글, 좋아요 ${totalLikes}, 댓글 ${totalComments}, 공유 ${totalShares}`);
  
  return {
    platform: 'naver-blog',
    accountId: `naver-blog-${blogId}`,
    totalPosts,
    totalViews: 0, // 비로그인 API 제한
    totalLikes,
    totalComments,
    totalShares,
    recentPosts
  };
}

// ===== 유튜브 크롤링 =====
async function crawlYouTube(channelId, apiKey) {
  console.log(`🎬 유튜브 크롤링: ${channelId}`);
  
  try {
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`;
    const channelData = await fetchJSON(channelUrl);
    
    if (!channelData.items?.length) {
      console.log('  ⚠️ 채널 데이터 없음');
      return null;
    }
    
    const stats = channelData.items[0].statistics;
    const snippet = channelData.items[0].snippet;
    
    // 최근 영상 목록
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=10&type=video&key=${apiKey}`;
    const searchData = await fetchJSON(searchUrl);
    const videoIds = (searchData.items || []).map(v => v.id.videoId).filter(Boolean);
    
    let recentPosts = [];
    if (videoIds.length > 0) {
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds.join(',')}&key=${apiKey}`;
      const videosData = await fetchJSON(videosUrl);
      
      recentPosts = (videosData.items || []).map(v => ({
        id: v.id,
        title: v.snippet.title,
        url: `https://youtube.com/watch?v=${v.id}`,
        views: parseInt(v.statistics.viewCount) || 0,
        likes: parseInt(v.statistics.likeCount) || 0,
        comments: parseInt(v.statistics.commentCount) || 0,
        date: v.snippet.publishedAt?.split('T')[0] || ''
      }));
    }
    
    const result = {
      platform: 'youtube',
      accountId: 'youtube-vet-nutrition',
      channelName: snippet.title,
      totalSubscribers: parseInt(stats.subscriberCount) || 0,
      totalPosts: parseInt(stats.videoCount) || 0,
      totalViews: parseInt(stats.viewCount) || 0,
      totalLikes: recentPosts.reduce((s, v) => s + v.likes, 0),
      totalComments: recentPosts.reduce((s, v) => s + v.comments, 0),
      recentPosts
    };
    
    console.log(`  ✅ 구독자 ${result.totalSubscribers}, 총조회 ${result.totalViews}, 영상 ${result.totalPosts}개`);
    return result;
  } catch(e) {
    console.error('  ❌ 유튜브 크롤링 실패:', e.message);
    return null;
  }
}

// ===== 인스타그램 =====
function getInstagramData() {
  console.log(`📸 인스타그램: 수동 데이터 확인`);
  const snapPath = path.join(DATA_DIR, 'performance-snapshot.json');
  if (fs.existsSync(snapPath)) {
    const snap = JSON.parse(fs.readFileSync(snapPath, 'utf8'));
    const igData = snap.accounts?.find(a => a.accountId === 'instagram-solopet6a');
    if (igData) {
      console.log(`  ✅ 기존 데이터 유지 (팔로워 ${igData.totalFollowers || 0})`);
      return igData;
    }
  }
  return {
    platform: 'instagram',
    accountId: 'instagram-solopet6a',
    totalPosts: 0, totalFollowers: 0, totalViews: 0,
    totalLikes: 0, totalComments: 0, recentPosts: [],
    note: 'Instagram API 제한 — 수동 업데이트 필요'
  };
}

// ===== 메인 =====
async function main() {
  const today = new Date().toISOString().split('T')[0];
  console.log(`\n📊 성과 크롤링 시작 (${today})\n`);
  
  const snapPath = path.join(DATA_DIR, 'performance-snapshot.json');
  let existing = { history: [] };
  if (fs.existsSync(snapPath)) {
    try { existing = JSON.parse(fs.readFileSync(snapPath, 'utf8')); } catch(e) {}
  }
  
  const accounts = [];
  
  // 1. 네이버 블로그
  const naverData = await crawlNaverBlog('lifelogics');
  if (naverData) accounts.push(naverData);
  
  // 2. 유튜브
  const ytApiKey = process.env.YOUTUBE_API_KEY;
  if (ytApiKey) {
    const ytData = await crawlYouTube('UCyQD6agmbiwm0xLraDDsO2Q', ytApiKey);
    if (ytData) accounts.push(ytData);
  } else {
    console.log('⚠️ YOUTUBE_API_KEY 없음');
  }
  
  // 3. 인스타그램
  accounts.push(getInstagramData());
  
  // 히스토리 스냅샷
  const todaySnap = {
    date: today,
    timestamp: new Date().toISOString(),
    accounts: accounts.map(a => ({
      accountId: a.accountId,
      platform: a.platform,
      totalPosts: a.totalPosts || 0,
      totalViews: a.totalViews || 0,
      totalLikes: a.totalLikes || 0,
      totalComments: a.totalComments || 0,
      totalShares: a.totalShares || 0,
      totalSubscribers: a.totalSubscribers || a.totalFollowers || 0
    }))
  };
  
  // 히스토리 업데이트 (오늘 교체, 30일 보존)
  const history = (existing.history || []).filter(h => h.date !== today);
  history.push(todaySnap);
  history.sort((a, b) => b.date.localeCompare(a.date));
  
  // 전일 대비 변화 계산
  const yesterday = history.find(h => h.date !== today);
  const changes = {};
  if (yesterday) {
    for (const acc of todaySnap.accounts) {
      const prev = yesterday.accounts?.find(a => a.accountId === acc.accountId);
      if (prev) {
        changes[acc.accountId] = {
          viewsDiff: acc.totalViews - prev.totalViews,
          likesDiff: acc.totalLikes - prev.totalLikes,
          commentsDiff: acc.totalComments - prev.totalComments,
          postsDiff: acc.totalPosts - prev.totalPosts,
          sharesDiff: (acc.totalShares || 0) - (prev.totalShares || 0),
          subscribersDiff: (acc.totalSubscribers || 0) - (prev.totalSubscribers || 0)
        };
      }
    }
  }
  
  const result = {
    lastCrawled: new Date().toISOString(),
    today,
    accounts,
    changes,
    history: history.slice(0, 30)
  };
  
  fs.writeFileSync(snapPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`\n✅ 저장 완료: ${snapPath}`);
  
  // 요약 출력
  console.log('\n📈 오늘의 성과:');
  for (const acc of accounts) {
    const ch = changes[acc.accountId];
    const diff = ch ? ` (전일 대비: 좋아요 ${ch.likesDiff >= 0 ? '+' : ''}${ch.likesDiff}, 댓글 ${ch.commentsDiff >= 0 ? '+' : ''}${ch.commentsDiff})` : ' (첫 크롤링)';
    if (acc.platform === 'youtube') {
      console.log(`  🎬 유튜브: 구독 ${acc.totalSubscribers} / 총조회 ${acc.totalViews} / 영상 ${acc.totalPosts}개${diff}`);
    } else if (acc.platform === 'naver-blog') {
      console.log(`  📗 블로그: 글 ${acc.totalPosts}개 / 좋아요 ${acc.totalLikes} / 댓글 ${acc.totalComments} / 공유 ${acc.totalShares}${diff}`);
    } else {
      console.log(`  📸 인스타: 팔로워 ${acc.totalFollowers || 0} / 게시물 ${acc.totalPosts}개${diff}`);
    }
  }
}

main().catch(e => {
  console.error('❌ 크롤링 실패:', e);
  process.exit(1);
});
