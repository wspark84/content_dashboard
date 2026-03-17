const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'content-db.json');
const raw = fs.readFileSync(dbPath, 'utf8');
const db = JSON.parse(raw);

function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractKeywords(title) {
  // Remove common filler words, keep meaningful keywords
  const cleaned = title
    .replace(/[,.:!?()（）\[\]「」~·•\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const stopwords = new Set([
    '반려동물', '강아지', '고양이', '펫', '우리', '이렇게', '위험합니다',
    '알아보기', '알아봅시다', '총정리', '가이드', '완벽', '정리',
    '방법', '원인', '증상', '치료', '예방', '관리', '중요성',
    '대해', '위한', '이란', '무엇', '어떻게', '왜', '꼭', '할',
    '수', '있는', '없는', '하는', '되는', '인', '의', '과', '와',
    '에', '를', '을', '이', '가', '은', '는', '도', '로', '으로',
    '에서', '까지', '부터', '한', '및', '그', '것', '때', '때문',
  ]);
  const words = cleaned.split(' ').filter(w => w.length >= 2 && !stopwords.has(w));
  return words;
}

function titleKeywordsInContent(title, contentFirst500) {
  const keywords = extractKeywords(title);
  if (keywords.length === 0) return true; // no keywords to check
  return keywords.some(kw => contentFirst500.includes(kw));
}

function isTemplate(fullContent) {
  if (!fullContent) return true;
  if (fullContent.includes('반려동물의 정상적인 성장과 건강 유지에 필수적인 영양소')) return 'nutrition_template';
  if (fullContent.includes('비교적 흔하게 발생하는 질환으로, 적절한 진단과 치료가 이루어지지')) return 'disease_template';
  return false;
}

function isGenericDescription(desc) {
  if (!desc) return true;
  if (desc.includes('질병 관련 중요 정보를 제공합니다')) return true;
  if (desc.includes('반려동물 건강을 위한 중요한')) return true;
  if (desc.includes('반려동물의 건강을 위해 꼭 알아야 할')) return true;
  if (desc.includes('Filter Tray')) return true;
  if (desc.length < 20) return true;
  return false;
}

function generateDescription(title, fullContent) {
  const text = stripHtml(fullContent);
  const first500 = text.slice(0, 500);
  
  // Split into sentences
  const sentences = first500
    .split(/[.。!?\n]+/)
    .map(s => s.trim())
    .filter(s => s.length >= 15 && s.length <= 120);
  
  if (sentences.length === 0) return null;
  
  const keywords = extractKeywords(title);
  
  // Find sentences containing title keywords
  let bestSentences = sentences.filter(s => 
    keywords.some(kw => s.includes(kw))
  );
  
  if (bestSentences.length === 0) {
    bestSentences = sentences;
  }
  
  // Take first 1-2 best sentences, aiming for 60-100 chars
  let result = bestSentences[0];
  
  if (result.length < 55 && bestSentences.length > 1) {
    result = bestSentences[0] + '. ' + bestSentences[1];
  }
  
  // Trim to ~100 chars if too long
  if (result.length > 110) {
    // Try to cut at a natural break
    const cutPoint = result.lastIndexOf(',', 100);
    if (cutPoint > 50) {
      result = result.slice(0, cutPoint);
    } else {
      // Cut at space
      const spacePoint = result.lastIndexOf(' ', 100);
      if (spacePoint > 50) {
        result = result.slice(0, spacePoint);
      } else {
        result = result.slice(0, 100);
      }
    }
  }
  
  // Clean up ending
  result = result.replace(/[,\s]+$/, '');
  if (!result.endsWith('.') && !result.endsWith('다') && !result.endsWith('요')) {
    // don't add period if it ends naturally
  }
  
  if (result.length < 20) return null;
  
  return result;
}

// === MAIN PROCESSING ===

let total = 0;
let resummaryCount = 0;
let templateCount = 0;
let goodCount = 0;
let skippedNoKeyword = 0;

const templateByCategory = {};
const templateBySubcategory = {};
const templatePatternCounts = {
  'nutrition_template': 0,
  'disease_template': 0,
  'no_keyword_match': 0,
  'no_fullContent': 0,
  'short_fullContent': 0,
};
const resummaryExamples = [];

for (const cat of db.categories) {
  for (const sub of cat.subcategories) {
    for (const topic of sub.topics) {
      total++;
      const fc = topic.fullContent || '';
      const desc = topic.description || '';
      
      // Check if fullContent is good
      if (fc.length < 100) {
        templateCount++;
        const patKey = fc.length === 0 ? 'no_fullContent' : 'short_fullContent';
        templatePatternCounts[patKey]++;
        templateByCategory[cat.name] = (templateByCategory[cat.name] || 0) + 1;
        const subKey = `${cat.name} > ${sub.name}`;
        templateBySubcategory[subKey] = (templateBySubcategory[subKey] || 0) + 1;
        continue;
      }
      
      // Check template patterns
      const tmpl = isTemplate(fc);
      if (tmpl) {
        templateCount++;
        templatePatternCounts[tmpl]++;
        templateByCategory[cat.name] = (templateByCategory[cat.name] || 0) + 1;
        const subKey = `${cat.name} > ${sub.name}`;
        templateBySubcategory[subKey] = (templateBySubcategory[subKey] || 0) + 1;
        continue;
      }
      
      // Check if title keywords appear in first 500 chars
      const plainText = stripHtml(fc);
      const first500 = plainText.slice(0, 500);
      if (!titleKeywordsInContent(topic.title, first500)) {
        templateCount++;
        skippedNoKeyword++;
        templatePatternCounts['no_keyword_match']++;
        templateByCategory[cat.name] = (templateByCategory[cat.name] || 0) + 1;
        const subKey = `${cat.name} > ${sub.name}`;
        templateBySubcategory[subKey] = (templateBySubcategory[subKey] || 0) + 1;
        continue;
      }
      
      // Good fullContent
      goodCount++;
      
      // Check if description needs regeneration
      if (isGenericDescription(desc)) {
        const newDesc = generateDescription(topic.title, fc);
        if (newDesc) {
          if (resummaryExamples.length < 10) {
            resummaryExamples.push({
              title: topic.title,
              oldDesc: desc,
              newDesc: newDesc,
            });
          }
          topic.description = newDesc;
          resummaryCount++;
        }
      }
    }
  }
}

console.log('=== 처리 결과 ===');
console.log(`전체 토픽: ${total}`);
console.log(`정상 fullContent: ${goodCount}`);
console.log(`템플릿/부실: ${templateCount}`);
console.log(`요약 재생성: ${resummaryCount}`);
console.log(`제목키워드 불일치: ${skippedNoKeyword}`);
console.log('\n=== 템플릿 패턴별 ===');
console.log(JSON.stringify(templatePatternCounts, null, 2));
console.log('\n=== 카테고리별 템플릿 ===');
console.log(JSON.stringify(templateByCategory, null, 2));
console.log('\n=== 재생성 예시 (처음 5개) ===');
resummaryExamples.slice(0, 5).forEach(ex => {
  console.log(`\n제목: ${ex.title}`);
  console.log(`  이전: ${ex.oldDesc}`);
  console.log(`  이후: ${ex.newDesc}`);
});

// Save updated DB
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('\n✅ content-db.json 저장 완료');

// Generate audit report
const audit = {
  auditDate: "2026-03-17",
  totalTopics: total,
  goodFullContent: goodCount,
  templateFullContent: templateCount,
  resummaryDone: resummaryCount,
  templateByCategory,
  templateBySubcategory,
  templatePatterns: Object.entries(templatePatternCounts)
    .filter(([k, v]) => v > 0)
    .map(([k, v]) => `${k}: ${v}건`),
  templatePatternCounts,
};

const auditPath = path.join(__dirname, '..', 'data', 'fullcontent-audit.json');
fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2), 'utf8');
console.log('✅ fullcontent-audit.json 저장 완료');
