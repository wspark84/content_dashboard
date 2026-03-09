const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3300;

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'content-db.json'), 'utf8'));

function getAllTopics() {
  const topics = [];
  for (const cat of data.categories) {
    for (const sub of cat.subcategories) {
      for (const t of sub.topics) {
        topics.push({ ...t, categoryId: cat.id, categoryName: cat.name, categoryIcon: cat.icon, subcategoryId: sub.id, subcategoryName: sub.name, subcategoryIcon: sub.icon });
      }
    }
  }
  return topics;
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/categories', (req, res) => {
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
  const topics = getAllTopics().sort((a, b) => b.viralScore - a.viralScore).slice(0, 10);
  res.json(topics);
});

app.get('/api/stats', (req, res) => {
  const stats = { total: 0, categories: {} };
  for (const cat of data.categories) {
    let catTotal = 0;
    for (const sub of cat.subcategories) catTotal += sub.topics.length;
    stats.categories[cat.name] = catTotal;
    stats.total += catTotal;
  }
  res.json(stats);
});

app.listen(PORT, () => console.log(`Pet Content Dashboard running on http://localhost:${PORT}`));
