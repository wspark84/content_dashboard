#!/bin/bash
# 네이버 카페 크롤링 → 필터링 → DB 반영 파이프라인
set -e
cd /Users/wspark/.openclaw/workspace/pet-content-dashboard

source /Users/wspark/.openclaw/workspace/.env
export NAVER_ID NAVER_PW

echo "$(date '+%Y-%m-%d %H:%M') 카페 크롤링 파이프라인 시작"

# 1. 크롤링
echo "1/2 크롤링..."
node scripts/crawl-naver-cafe.mjs

# 2. 필터링 + DB 반영
echo "2/2 필터링..."
node scripts/filter-cafe-topics.mjs

echo "$(date '+%Y-%m-%d %H:%M') 완료"
