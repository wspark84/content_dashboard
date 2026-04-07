#!/usr/bin/env node

/**
 * NotebookLM 브라우저 추출 결과를 content-db.json에 병합하는 스크립트
 * 
 * 사용법:
 *   node generate-db-from-notebooklm.js
 * 
 * 입력: data/notebooklm-raw/*.json (노트북별 JSON 파일들)
 * 출력: data/content-db.json 업데이트 (기존 527개 주제와 병합)
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DB_PATH = './data/content-db.json';
const NOTEBOOKLM_RAW_DIR = './data/notebooklm-raw';

// 기본 카테고리/서브카테고리 매핑
const CATEGORY_MAPPING = {
  'VET_Pet_care': {
    categoryId: 'veterinary',
    categoryName: '수의학',
    categoryIcon: '🏥'
  },
  '행동분석학': {
    categoryId: 'behavior',
    categoryName: '행동분석학',
    categoryIcon: '🧠'
  }
};

// 서브카테고리 자동 추론 키워드
const SUBCATEGORY_KEYWORDS = {
  '영양': { id: 'vet-nutrition', name: '영양학', icon: '🥗' },
  '질병': { id: 'vet-disease', name: '질병학', icon: '🩺' },
  '행동': { id: 'behavior-analysis', name: '행동분석', icon: '🎭' },
  '훈련': { id: 'behavior-training', name: '훈련', icon: '🎯' },
  '사료': { id: 'vet-nutrition', name: '영양학', icon: '🥗' },
  '건강': { id: 'vet-health', name: '건강관리', icon: '💊' }
};

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function loadContentDB() {
  if (!fs.existsSync(CONTENT_DB_PATH)) {
    throw new Error(`content-db.json not found: ${CONTENT_DB_PATH}`);
  }
  return JSON.parse(fs.readFileSync(CONTENT_DB_PATH, 'utf-8'));
}

function saveContentDB(data) {
  fs.writeFileSync(CONTENT_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  log(`Updated: ${CONTENT_DB_PATH}`);
}

function loadNotebookLMFiles() {
  if (!fs.existsSync(NOTEBOOKLM_RAW_DIR)) {
    log(`NotebookLM raw directory not found: ${NOTEBOOKLM_RAW_DIR}`);
    return [];
  }

  const files = fs.readdirSync(NOTEBOOKLM_RAW_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const filePath = path.join(NOTEBOOKLM_RAW_DIR, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return { filename: file, data };
      } catch (err) {
        log(`Error loading ${file}: ${err.message}`);
        return null;
      }
    })
    .filter(Boolean);

  log(`Loaded ${files.length} NotebookLM files`);
  return files;
}

function inferSubcategory(title, description, tags) {
  const text = `${title} ${description} ${tags?.join(' ') || ''}`.toLowerCase();
  
  for (const [keyword, subcategory] of Object.entries(SUBCATEGORY_KEYWORDS)) {
    if (text.includes(keyword.toLowerCase())) {
      return subcategory;
    }
  }
  
  // 기본값
  return { id: 'general', name: '일반', icon: '📋' };
}

function inferAnimal(title, description, tags) {
  const text = `${title} ${description} ${tags?.join(' ') || ''}`.toLowerCase();
  
  const dogKeywords = ['강아지', '개', 'dog', '견', '퍼피'];
  const catKeywords = ['고양이', '고양', 'cat', '냥이', '키튼'];
  
  const hasDog = dogKeywords.some(k => text.includes(k));
  const hasCat = catKeywords.some(k => text.includes(k));
  
  if (hasDog && hasCat) return 'both';
  if (hasDog) return 'dog';
  if (hasCat) return 'cat';
  return 'both';
}

function inferDifficulty(title, description, fullContent) {
  const text = `${title} ${description} ${fullContent || ''}`.toLowerCase();
  
  const basicKeywords = ['기초', '초보', '입문', '쉬운', '간단'];
  const advancedKeywords = ['전문', '고급', '심화', '복잡', '전공'];
  
  const hasBasic = basicKeywords.some(k => text.includes(k));
  const hasAdvanced = advancedKeywords.some(k => text.includes(k));
  
  if (hasAdvanced) return 'advanced';
  if (hasBasic) return 'basic';
  return 'intermediate';
}

function generateViralScore(title, description) {
  // 바이럴 요소 점수 계산
  let score = Math.floor(Math.random() * 30) + 60; // 60~90 기본
  
  const viralKeywords = ['충격', '놀라운', '비밀', '반전', '꿀팁', '필수', '위험'];
  const text = `${title} ${description}`.toLowerCase();
  
  viralKeywords.forEach(keyword => {
    if (text.includes(keyword)) score += 5;
  });
  
  return Math.min(score, 95);
}

function processNotebookLMTopic(raw, sourceNotebook) {
  const category = CATEGORY_MAPPING[sourceNotebook] || {
    categoryId: 'general',
    categoryName: '일반',
    categoryIcon: '📋'
  };

  const subcategory = inferSubcategory(raw.title, raw.description, raw.tags);
  
  return {
    title: raw.title,
    description: raw.description || '상세 설명이 준비되고 있습니다.',
    summary: raw.summary || null,
    fullContent: raw.fullContent || null,
    references: raw.references || [],
    sourceNotebook: sourceNotebook,
    sourceDocument: raw.sourceDocument || null,
    tags: raw.tags || [],
    animal: raw.animal || inferAnimal(raw.title, raw.description, raw.tags),
    difficulty: raw.difficulty || inferDifficulty(raw.title, raw.description, raw.fullContent),
    viralScore: raw.viralScore || generateViralScore(raw.title, raw.description),
    keyPoints: raw.keyPoints || [],
    targetAudience: raw.targetAudience || '반려동물 보호자',
    cardNewsAngle: raw.cardNewsAngle || '실용적인 팁으로 구성된 카드뉴스',
    
    // 카테고리 정보 (UI용)
    categoryId: category.categoryId,
    categoryName: category.categoryName,
    categoryIcon: category.categoryIcon,
    subcategoryId: subcategory.id,
    subcategoryName: subcategory.name,
    subcategoryIcon: subcategory.icon
  };
}

function mergeTopicsToContentDB(contentDB, newTopics) {
  // 기존 주제 제목들 수집 (중복 제거용)
  const existingTitles = new Set();
  contentDB.categories.forEach(cat => {
    cat.subcategories.forEach(sub => {
      sub.topics.forEach(topic => {
        existingTitles.add(topic.title);
      });
    });
  });

  let addedCount = 0;
  let skippedCount = 0;

  newTopics.forEach(topic => {
    if (existingTitles.has(topic.title)) {
      skippedCount++;
      return;
    }

    // 카테고리 찾기 또는 생성
    let category = contentDB.categories.find(c => c.id === topic.categoryId);
    if (!category) {
      category = {
        id: topic.categoryId,
        name: topic.categoryName,
        subcategories: []
      };
      contentDB.categories.push(category);
    }

    // 서브카테고리 찾기 또는 생성
    let subcategory = category.subcategories.find(s => s.id === topic.subcategoryId);
    if (!subcategory) {
      subcategory = {
        id: topic.subcategoryId,
        name: topic.subcategoryName,
        icon: topic.subcategoryIcon,
        topics: []
      };
      category.subcategories.push(subcategory);
    }

    // UI용 필드들 제거하고 추가
    const cleanTopic = { ...topic };
    delete cleanTopic.categoryId;
    delete cleanTopic.categoryName;
    delete cleanTopic.categoryIcon;
    delete cleanTopic.subcategoryId;
    delete cleanTopic.subcategoryName;
    delete cleanTopic.subcategoryIcon;

    subcategory.topics.push(cleanTopic);
    existingTitles.add(topic.title);
    addedCount++;
  });

  return { addedCount, skippedCount };
}

function main() {
  log('🚀 Starting NotebookLM to content-db merge...');

  try {
    // 1. 기존 content-db.json 로드
    const contentDB = loadContentDB();
    const originalCount = contentDB.categories.reduce((sum, cat) => 
      sum + cat.subcategories.reduce((subSum, sub) => subSum + sub.topics.length, 0), 0);
    
    log(`📊 Current topics in DB: ${originalCount}`);

    // 2. NotebookLM 파일들 로드
    const notebookFiles = loadNotebookLMFiles();
    if (notebookFiles.length === 0) {
      log('⚠️ No NotebookLM files found. Nothing to merge.');
      return;
    }

    // 3. 각 노트북 파일 처리
    let allNewTopics = [];
    
    notebookFiles.forEach(({ filename, data }) => {
      const sourceNotebook = path.basename(filename, '.json');
      log(`📖 Processing: ${sourceNotebook}`);
      
      if (Array.isArray(data.topics)) {
        const topics = data.topics.map(raw => processNotebookLMTopic(raw, sourceNotebook));
        allNewTopics.push(...topics);
        log(`  ✅ ${topics.length} topics processed`);
      } else {
        log(`  ⚠️ No topics array found in ${filename}`);
      }
    });

    log(`📝 Total new topics to merge: ${allNewTopics.length}`);

    // 4. content-db에 병합
    const { addedCount, skippedCount } = mergeTopicsToContentDB(contentDB, allNewTopics);

    // 5. 업데이트된 DB 저장
    saveContentDB(contentDB);

    const finalCount = contentDB.categories.reduce((sum, cat) => 
      sum + cat.subcategories.reduce((subSum, sub) => subSum + sub.topics.length, 0), 0);

    // 6. 결과 보고
    log('📈 Merge Summary:');
    log(`  📊 Original topics: ${originalCount}`);
    log(`  ➕ Added topics: ${addedCount}`);
    log(`  ⏩ Skipped (duplicates): ${skippedCount}`);
    log(`  🎯 Final total: ${finalCount}`);
    
    if (addedCount > 0) {
      log('✅ Content database successfully updated!');
    } else {
      log('ℹ️ No new topics added (all were duplicates)');
    }

  } catch (error) {
    log(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { processNotebookLMTopic, mergeTopicsToContentDB };