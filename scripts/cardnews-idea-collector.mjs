/**
 * 카드뉴스 아이디어 수집기
 * 강사모/고다행 네이버 카페에서 인기글을 크롤링하여
 * cardnews_ideas 테이블에 아이디어로 등록
 *
 * Usage: node scripts/cardnews-idea-collector.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '../src/shared/config.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gznarqkmuafkxotljfzu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6bmFycWttdWFma3hvdGxqZnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Njc0NDIsImV4cCI6MjA4ODE0MzQ0Mn0.LJOomQJRuNNDbl1kc9IHkYLfV4sZR_xcwylnl9fXgP8';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
};

const SOURCES = [
  {
    name: 'gangsamo',
    label: '강사모',
    cafeId: config.sources.gangsamo.cafeId,
    cafeName: 'dogpalza',
    animal: '강아지',
  },
  {
    name: 'godahang',
    label: '고다행',
    cafeId: config.sources.godahang.cafeId,
    cafeName: 'ilovecat',
    animal: '고양이',
  },
];

// 카테고리 자동 분류 (키워드 기반)
function categorize(title, body) {
  const text = (title + ' ' + body).toLowerCase();
  if (/사료|간식|먹이|음식|급여|영양|캔|생식|건사료/.test(text)) return '사료';
  if (/병원|건강|질병|아파|수술|약|구토|설사|알러지|피부|접종|중성화/.test(text)) return '건강';
  if (/행동|짖|물|분리불안|훈련|사회화|산책|교육/.test(text)) return '행동';
  if (/리콜|사건|사고|뉴스|법|조례|학대/.test(text)) return '이슈';
  if (/감동|구조|입양|무지개|보호소|봉사/.test(text)) return '감동';
  return '꿀팁';
}

// 바이럴 점수 계산
function calcViralScore(views, comments, likes) {
  const v = Math.min(views / 500, 40);        // max 40
  const c = Math.min(comments / 20, 35);       // max 35
  const l = Math.min(likes / 30, 25);          // max 25
  return Math.round(v + c + l);
}

async function fetchPopularPosts(source) {
  const posts = [];
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  // 조회수 높은 순으로 가져오기
  for (const sortBy of ['date']) {
    try {
      const url = `https://apis.naver.com/cafe-web/cafe-mobile/CafeMobileWebArticleSearchListV3?cafeId=${source.cafeId}&pack=true&query=&page=1&perPage=50&sortBy=${sortBy}`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) continue;
      const data = await res.json();
      const articles = data?.message?.result?.articleList || [];

      for (const a of articles) {
        const ts = a.writeDateTimestamp || 0;
        // 최근 1일치만
        if (ts < oneDayAgo) continue;

        // 조회수 100 이상 또는 댓글 5개 이상만 필터링
        if ((a.readCount || 0) < 100 && (a.commentCount || 0) < 5) continue;

        posts.push({
          title: a.subject || '',
          body: (a.contentSummary || '').slice(0, 300),
          views: a.readCount || 0,
          comments: a.commentCount || 0,
          likes: a.likeItCount || 0,
          url: `https://cafe.naver.com/${source.cafeName}/${a.articleId}`,
          source: source.name,
          label: source.label,
        });
      }
    } catch (e) {
      console.warn(`[${source.name}] fetch failed:`, e.message);
    }
  }

  // 조회수+댓글 기준 상위 정렬
  posts.sort((a, b) => (b.views + b.comments * 50) - (a.views + a.comments * 50));
  return posts.slice(0, 10); // 소스당 상위 10개
}

async function run() {
  console.log('🎨 카드뉴스 아이디어 수집 시작...');
  let totalAdded = 0;

  for (const source of SOURCES) {
    console.log(`\n📡 [${source.label}] 인기글 수집 중...`);
    const posts = await fetchPopularPosts(source);
    console.log(`  → ${posts.length}개 인기글 발견`);

    for (const post of posts) {
      const category = categorize(post.title, post.body);
      const viralScore = calcViralScore(post.views, post.comments, post.likes);

      // 제목 기반 중복 체크
      const { data: existing } = await sb.from('cardnews_ideas')
        .select('id')
        .eq('title', post.title)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`  ⏭ 중복: ${post.title.slice(0, 40)}...`);
        continue;
      }

      const description = `${post.body}\n\n📊 조회 ${post.views} · 댓글 ${post.comments} · 좋아요 ${post.likes}\n🔗 ${post.url}`;

      const { error } = await sb.from('cardnews_ideas').insert({
        title: post.title,
        description,
        category,
        source: post.source,
        viral_score: viralScore,
        status: 'pending',
      });

      if (error) {
        console.warn(`  ❌ 저장 실패: ${error.message}`);
      } else {
        console.log(`  ✅ [${category}] ${post.title.slice(0, 40)}... (점수: ${viralScore})`);
        totalAdded++;
      }
    }
  }

  console.log(`\n🎉 완료! ${totalAdded}개 아이디어 추가됨`);
}

run().catch(console.error);
