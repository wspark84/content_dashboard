/**
 * 키워드 클러스터링 — 공통 단어 기반 유사도
 */

/**
 * 두 키워드의 유사도 (0~1) — 공통 단어 비율
 */
function similarity(a, b) {
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.length / union.size; // Jaccard
}

/**
 * 키워드 배열을 클러스터링
 * @param {string[]} keywords
 * @param {number} threshold - 유사도 임계값 (기본 0.3)
 * @returns {{ label: string, keywords: string[] }[]}
 */
export function clusterKeywords(keywords, threshold = 0.3) {
  if (keywords.length === 0) return [];

  const assigned = new Set();
  const clusters = [];

  for (const kw of keywords) {
    if (assigned.has(kw)) continue;

    const cluster = [kw];
    assigned.add(kw);

    for (const other of keywords) {
      if (assigned.has(other)) continue;
      if (similarity(kw, other) >= threshold) {
        cluster.push(other);
        assigned.add(other);
      }
    }

    // 라벨: 공통 단어 + 나머지 슬래시 연결
    const label = makeLabel(cluster);
    clusters.push({ label, keywords: cluster });
  }

  return clusters;
}

function makeLabel(keywords) {
  if (keywords.length === 1) return keywords[0];

  // 모든 키워드의 단어들
  const wordSets = keywords.map(k => new Set(k.split(/\s+/)));
  // 공통 단어
  const common = [...wordSets[0]].filter(w => wordSets.every(s => s.has(w)));
  // 고유 단어들
  const unique = keywords.flatMap(k =>
    k.split(/\s+/).filter(w => !common.includes(w))
  );
  const uniqueSet = [...new Set(unique)];

  if (common.length > 0 && uniqueSet.length > 0) {
    return `${common.join(' ')} ${uniqueSet.slice(0, 3).join('/')}`;
  }
  return keywords.slice(0, 2).join('/');
}
