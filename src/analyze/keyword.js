/**
 * 키워드 검증 모듈 — 네이버 자동완성 기반
 */

const AC_URL = 'https://ac.search.naver.com/nx/ac';

/**
 * 네이버 자동완성에서 연관 키워드 가져오기
 */
export async function getAutoComplete(keyword) {
  try {
    const url = `${AC_URL}?q=${encodeURIComponent(keyword)}&con=1&frm=nv&ans=2`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    // data.items is [[keywords], [keywords]] — first array is suggestions
    const items = data.items?.[0] || [];
    return items.map(item => (Array.isArray(item) ? item[0] : item));
  } catch {
    return [];
  }
}

/**
 * 키워드가 자동완성에 노출되는지 확인 → 검색량 간접 추정
 * 반환: 0~100 스코어
 */
export async function estimateSearchVolume(keyword) {
  const suggestions = await getAutoComplete(keyword);
  if (suggestions.length === 0) return 10; // 자동완성 안 뜨면 최소값

  // 키워드가 자동완성 목록에 포함되면 높은 점수
  const exact = suggestions.some(s => s === keyword);
  const partial = suggestions.some(s => s.includes(keyword) || keyword.includes(s));

  if (exact) return 80;
  if (partial) return 50;
  return 30; // 자동완성은 뜨지만 직접 매칭 안 됨
}

/**
 * 연관 키워드 확장
 */
export async function expandKeywords(keyword) {
  const suggestions = await getAutoComplete(keyword);
  // 원본 키워드 + 자동완성 결과
  const all = [keyword, ...suggestions];
  return [...new Set(all)];
}

/**
 * 네이버 블로그 검색 결과 수 조회 (경쟁도 파악)
 * 웹 스크래핑 방식 — API 키 불필요
 */
export async function getBlogCompetition(keyword) {
  try {
    const url = `https://search.naver.com/search.naver?where=blog&query=${encodeURIComponent(keyword)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!res.ok) return 100000;
    const html = await res.text();
    // "블로그 1-10 / 12,345건" 패턴에서 총 건수 추출
    const match = html.match(/[\d,]+건/);
    if (match) {
      return parseInt(match[0].replace(/[,건]/g, ''), 10) || 100000;
    }
    return 100000;
  } catch {
    return 100000;
  }
}
