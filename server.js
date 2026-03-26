const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3300;

// JSON body 파싱 미들웨어
app.use(express.json());

// === 데이터 로드/저장 헬퍼 ===

const DATA_DIR = path.join(__dirname, 'data');

function loadData() {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'content-db.json'), 'utf8'));
}

function saveData(data) {
  // 백업 생성
  const src = path.join(DATA_DIR, 'content-db.json');
  const backup = path.join(DATA_DIR, 'content-db-backup.json');
  try {
    fs.copyFileSync(src, backup);
  } catch (e) {
    console.error('백업 생성 실패:', e.message);
  }
  fs.writeFileSync(src, JSON.stringify(data, null, 2), 'utf8');
}

function loadAccounts() {
  const filePath = path.join(DATA_DIR, 'accounts.json');
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return { accounts: [] };
  }
}

function saveAccounts(data) {
  fs.writeFileSync(path.join(DATA_DIR, 'accounts.json'), JSON.stringify(data, null, 2), 'utf8');
}

function getAllTopics() {
  const data = loadData();
  const topics = [];
  for (const cat of data.categories) {
    for (const sub of cat.subcategories) {
      for (let i = 0; i < sub.topics.length; i++) {
        const t = sub.topics[i];
        topics.push({
          ...t,
          _index: i,
          categoryId: cat.id,
          categoryName: cat.name,
          categoryIcon: cat.icon,
          subcategoryId: sub.id,
          subcategoryName: sub.name,
          subcategoryIcon: sub.icon
        });
      }
    }
  }
  return topics;
}

// === 정적 파일 (캐시 무효화) ===
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
  }
}));

// === 기존 API ===

app.get('/api/categories', (req, res) => {
  const data = loadData();
  const cats = data.categories.map(c => ({
    id: c.id, name: c.name, icon: c.icon,
    subcategories: c.subcategories.map(s => ({ id: s.id, name: s.name, icon: s.icon, count: s.topics.length }))
  }));
  res.json(cats);
});

app.get('/api/topics', (req, res) => {
  let topics = getAllTopics();
  const { q, animal, category, subcategory, difficulty, sort } = req.query;
  if (q) {
    const lq = q.toLowerCase();
    topics = topics.filter(t => t.title.toLowerCase().includes(lq) || t.description.toLowerCase().includes(lq) || t.tags.some(tag => tag.toLowerCase().includes(lq)));
  }
  if (animal && animal !== 'all') topics = topics.filter(t => t.animal === animal || t.animal === 'both');
  if (category) topics = topics.filter(t => t.categoryId === category);
  if (subcategory) topics = topics.filter(t => t.subcategoryId === subcategory);
  if (difficulty) topics = topics.filter(t => t.difficulty === difficulty);
  if (sort === 'viral') topics.sort((a, b) => b.viralScore - a.viralScore);
  else if (sort === 'alpha') topics.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
  else topics.sort((a, b) => b.viralScore - a.viralScore);
  res.json({ total: topics.length, topics });
});

app.get('/api/trends', (req, res) => {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const topics = getAllTopics()
    .filter(t => {
      // Use crawledAt (trend topics) or date (regular topics)
      const dateStr = t.crawledAt || t.date;
      if (!dateStr) return false;
      // Parse various date formats: "2026-03-25", "2026.03.25", ISO string
      const normalized = String(dateStr).replace(/\./g, '-').split('T')[0];
      const parsed = new Date(normalized);
      return !isNaN(parsed.getTime()) && parsed >= twoWeeksAgo;
    })
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 10);
  res.json(topics);
});

// 개별 토픽 상세 조회
app.get('/api/topic/:categoryId/:subcategoryId/:index', (req, res) => {
  const { categoryId, subcategoryId, index } = req.params;
  const topics = getAllTopics();
  const topic = topics.find(t => t.categoryId === categoryId && t.subcategoryId === subcategoryId && t.title === decodeURIComponent(index));
  if (!topic) return res.status(404).json({ error: 'Not found' });
  res.json(topic);
});

app.get('/api/stats', (req, res) => {
  const data = loadData();
  const stats = { total: 0, categories: {} };
  for (const cat of data.categories) {
    let catTotal = 0;
    for (const sub of cat.subcategories) catTotal += sub.topics.length;
    stats.categories[cat.name] = catTotal;
    stats.total += catTotal;
  }
  res.json(stats);
});

// === 계정 API ===

// 전체 계정 목록
app.get('/api/accounts', (req, res) => {
  try {
    const data = loadAccounts();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: '계정 데이터 로드 실패', detail: e.message });
  }
});

// 새 계정 등록
app.post('/api/accounts', (req, res) => {
  try {
    const { id, platform, name, url, channelId, crawlEnabled } = req.body;
    if (!id || !platform || !name) {
      return res.status(400).json({ error: 'id, platform, name은 필수입니다' });
    }
    const data = loadAccounts();
    if (data.accounts.find(a => a.id === id)) {
      return res.status(409).json({ error: '이미 존재하는 계정 ID입니다' });
    }
    const account = { id, platform, name, url: url || '', crawlEnabled: crawlEnabled !== false };
    if (channelId) account.channelId = channelId;
    data.accounts.push(account);
    saveAccounts(data);
    res.status(201).json(account);
  } catch (e) {
    res.status(500).json({ error: '계정 등록 실패', detail: e.message });
  }
});

// 계정 수정
app.put('/api/accounts/:id', (req, res) => {
  try {
    const data = loadAccounts();
    const idx = data.accounts.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: '계정을 찾을 수 없습니다' });
    const updates = req.body;
    // id 변경 불가
    delete updates.id;
    Object.assign(data.accounts[idx], updates);
    saveAccounts(data);
    res.json(data.accounts[idx]);
  } catch (e) {
    res.status(500).json({ error: '계정 수정 실패', detail: e.message });
  }
});

// 계정 삭제
app.delete('/api/accounts/:id', (req, res) => {
  try {
    const data = loadAccounts();
    const idx = data.accounts.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: '계정을 찾을 수 없습니다' });
    data.accounts.splice(idx, 1);
    saveAccounts(data);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '계정 삭제 실패', detail: e.message });
  }
});

// === 발행 API ===

// 토픽 찾기 헬퍼 (카테고리/서브카테고리/인덱스로)
function findTopic(data, categoryId, subcategoryId, index) {
  const cat = data.categories.find(c => c.id === categoryId);
  if (!cat) return null;
  const sub = cat.subcategories.find(s => s.id === subcategoryId);
  if (!sub) return null;
  const idx = parseInt(index, 10);
  if (isNaN(idx) || idx < 0 || idx >= sub.topics.length) return null;
  return { topic: sub.topics[idx], topicIndex: idx, sub, cat };
}

// 발행 기록 추가
app.post('/api/topics/:categoryId/:subcategoryId/:index/publish', (req, res) => {
  try {
    const { categoryId, subcategoryId, index } = req.params;
    const { accountId, postUrl, postId, publishedAt } = req.body;
    if (!accountId) return res.status(400).json({ error: 'accountId는 필수입니다' });

    // 계정 존재 확인
    const accounts = loadAccounts();
    const account = accounts.accounts.find(a => a.id === accountId);
    if (!account) return res.status(404).json({ error: '계정을 찾을 수 없습니다' });

    const data = loadData();
    const found = findTopic(data, categoryId, subcategoryId, index);
    if (!found) return res.status(404).json({ error: '주제를 찾을 수 없습니다' });

    const { topic } = found;
    if (!topic.publications) topic.publications = [];

    const publication = {
      accountId,
      platform: account.platform,
      publishedAt: publishedAt || new Date().toISOString(),
      postUrl: postUrl || '',
      postId: postId || '',
      metrics: { views: 0, likes: 0, comments: 0, shares: 0, lastCrawled: null },
      metricsHistory: []
    };
    topic.publications.push(publication);
    saveData(data);
    res.status(201).json(publication);
  } catch (e) {
    res.status(500).json({ error: '발행 기록 추가 실패', detail: e.message });
  }
});

// 발행 기록 삭제
app.delete('/api/topics/:categoryId/:subcategoryId/:index/publish/:pubIndex', (req, res) => {
  try {
    const { categoryId, subcategoryId, index, pubIndex } = req.params;
    const data = loadData();
    const found = findTopic(data, categoryId, subcategoryId, index);
    if (!found) return res.status(404).json({ error: '주제를 찾을 수 없습니다' });

    const { topic } = found;
    const pi = parseInt(pubIndex, 10);
    if (!topic.publications || pi < 0 || pi >= topic.publications.length) {
      return res.status(404).json({ error: '발행 기록을 찾을 수 없습니다' });
    }
    topic.publications.splice(pi, 1);
    saveData(data);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '발행 기록 삭제 실패', detail: e.message });
  }
});

// === 성과 API ===

// 전체 성과 요약
app.get('/api/performance', (req, res) => {
  try {
    const topics = getAllTopics();
    const accounts = loadAccounts().accounts;
    let totalPublished = 0;
    let totalUnused = 0;

    // 계정별 통계
    const accountStats = {};
    for (const acc of accounts) {
      accountStats[acc.id] = {
        id: acc.id,
        name: acc.name,
        platform: acc.platform,
        publishedCount: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0
      };
    }

    for (const topic of topics) {
      const pubs = topic.publications || [];
      if (pubs.length > 0) {
        totalPublished++;
        for (const pub of pubs) {
          if (accountStats[pub.accountId]) {
            accountStats[pub.accountId].publishedCount++;
            accountStats[pub.accountId].totalViews += pub.metrics?.views || 0;
            accountStats[pub.accountId].totalLikes += pub.metrics?.likes || 0;
            accountStats[pub.accountId].totalComments += pub.metrics?.comments || 0;
            accountStats[pub.accountId].totalShares += pub.metrics?.shares || 0;
          }
        }
      } else {
        totalUnused++;
      }
    }

    // 크롤링 스냅샷 데이터 병합
    let snapshot = null;
    const snapPath = path.join(DATA_DIR, 'performance-snapshot.json');
    try {
      if (fs.existsSync(snapPath)) {
        snapshot = JSON.parse(fs.readFileSync(snapPath, 'utf8'));
      }
    } catch(e) {}

    // 스냅샷 데이터를 accountStats에 병합
    if (snapshot?.accounts) {
      for (const snapAcc of snapshot.accounts) {
        if (accountStats[snapAcc.accountId]) {
          const stat = accountStats[snapAcc.accountId];
          stat.crawledViews = snapAcc.totalViews || 0;
          stat.crawledLikes = snapAcc.totalLikes || 0;
          stat.crawledComments = snapAcc.totalComments || 0;
          stat.crawledShares = snapAcc.totalShares || 0;
          stat.crawledPosts = snapAcc.totalPosts || 0;
          stat.crawledSubscribers = snapAcc.totalSubscribers || snapAcc.totalFollowers || 0;
          stat.recentPosts = snapAcc.recentPosts || [];
          stat.channelName = snapAcc.channelName || '';
          // 크롤링 데이터가 더 정확하면 덮어쓰기
          if (snapAcc.totalViews > stat.totalViews) stat.totalViews = snapAcc.totalViews;
          if (snapAcc.totalLikes > stat.totalLikes) stat.totalLikes = snapAcc.totalLikes;
          if (snapAcc.totalComments > stat.totalComments) stat.totalComments = snapAcc.totalComments;
        }
      }
    }

    res.json({
      totalTopics: topics.length,
      totalPublished,
      totalUnused,
      accountStats: Object.values(accountStats),
      snapshot: snapshot ? {
        lastCrawled: snapshot.lastCrawled,
        changes: snapshot.changes || {},
        history: (snapshot.history || []).slice(0, 7) // 최근 7일만
      } : null
    });
  } catch (e) {
    res.status(500).json({ error: '성과 데이터 조회 실패', detail: e.message });
  }
});

// 특정 계정의 발행 주제 목록 + 성과
app.get('/api/performance/:accountId', (req, res) => {
  try {
    const { accountId } = req.params;
    const topics = getAllTopics();
    const accounts = loadAccounts().accounts;
    const account = accounts.find(a => a.id === accountId);
    if (!account) return res.status(404).json({ error: '계정을 찾을 수 없습니다' });

    const published = [];
    for (const topic of topics) {
      const pubs = topic.publications || [];
      for (const pub of pubs) {
        if (pub.accountId === accountId) {
          published.push({
            title: topic.title,
            categoryId: topic.categoryId,
            categoryName: topic.categoryName,
            subcategoryId: topic.subcategoryId,
            subcategoryName: topic.subcategoryName,
            _index: topic._index,
            publishedAt: pub.publishedAt,
            postUrl: pub.postUrl,
            postId: pub.postId,
            metrics: pub.metrics || {},
            metricsHistory: pub.metricsHistory || []
          });
        }
      }
    }

    res.json({
      account,
      totalPublished: published.length,
      totalViews: published.reduce((s, p) => s + (p.metrics.views || 0), 0),
      totalLikes: published.reduce((s, p) => s + (p.metrics.likes || 0), 0),
      totalComments: published.reduce((s, p) => s + (p.metrics.comments || 0), 0),
      publications: published
    });
  } catch (e) {
    res.status(500).json({ error: '계정 성과 조회 실패', detail: e.message });
  }
});

// 특정 주제의 계정별 성과 비교
app.get('/api/performance/topic/:categoryId/:subcategoryId/:index', (req, res) => {
  try {
    const { categoryId, subcategoryId, index } = req.params;
    const data = loadData();
    const found = findTopic(data, categoryId, subcategoryId, index);
    if (!found) return res.status(404).json({ error: '주제를 찾을 수 없습니다' });

    const { topic } = found;
    const accounts = loadAccounts().accounts;
    const pubs = (topic.publications || []).map(pub => {
      const acc = accounts.find(a => a.id === pub.accountId);
      return {
        ...pub,
        accountName: acc ? acc.name : pub.accountId,
        accountPlatform: acc ? acc.platform : 'unknown'
      };
    });

    res.json({
      title: topic.title,
      publications: pubs,
      totalViews: pubs.reduce((s, p) => s + (p.metrics?.views || 0), 0),
      totalLikes: pubs.reduce((s, p) => s + (p.metrics?.likes || 0), 0),
      totalComments: pubs.reduce((s, p) => s + (p.metrics?.comments || 0), 0)
    });
  } catch (e) {
    res.status(500).json({ error: '주제 성과 조회 실패', detail: e.message });
  }
});

// === 메트릭 수동 업데이트 API (크롤링 대안) ===
app.put('/api/topics/:categoryId/:subcategoryId/:index/publish/:pubIndex/metrics', (req, res) => {
  try {
    const { categoryId, subcategoryId, index, pubIndex } = req.params;
    const { views, likes, comments, shares } = req.body;
    const data = loadData();
    const found = findTopic(data, categoryId, subcategoryId, index);
    if (!found) return res.status(404).json({ error: '주제를 찾을 수 없습니다' });

    const { topic } = found;
    const pi = parseInt(pubIndex, 10);
    if (!topic.publications || pi < 0 || pi >= topic.publications.length) {
      return res.status(404).json({ error: '발행 기록을 찾을 수 없습니다' });
    }

    const pub = topic.publications[pi];
    // 이전 메트릭을 히스토리에 저장
    if (pub.metrics && pub.metrics.lastCrawled) {
      pub.metricsHistory = pub.metricsHistory || [];
      pub.metricsHistory.push({ ...pub.metrics });
    }
    // 새 메트릭 업데이트
    pub.metrics = {
      views: views !== undefined ? views : (pub.metrics?.views || 0),
      likes: likes !== undefined ? likes : (pub.metrics?.likes || 0),
      comments: comments !== undefined ? comments : (pub.metrics?.comments || 0),
      shares: shares !== undefined ? shares : (pub.metrics?.shares || 0),
      lastCrawled: new Date().toISOString()
    };
    saveData(data);
    res.json(pub);
  } catch (e) {
    res.status(500).json({ error: '메트릭 업데이트 실패', detail: e.message });
  }
});

app.listen(PORT, () => console.log(`Pet Content Dashboard running on http://localhost:${PORT}`));
