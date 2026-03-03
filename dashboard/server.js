/**
 * 멍냥바이럴 대시보드 서버 — Express (port 3200)
 */
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDb } from '../src/shared/db.js';
import { approve, reject, getTeamLogs } from '../src/team/approval.js';
import { calculateFunnel, dailyFunnel } from '../src/track/funnel.js';
import { getCtaSummary } from '../src/track/conversion.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// --- API ---

app.get('/api/trending', (req, res) => {
  const db = getDb();
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const rows = db.prepare(`
    SELECT * FROM trending_topics WHERE date = ? ORDER BY score DESC LIMIT 20
  `).all(date);
  res.json(rows);
});

app.get('/api/contents', (req, res) => {
  const db = getDb();
  const status = req.query.status;
  let rows;
  if (status) {
    rows = db.prepare(`SELECT * FROM contents WHERE status = ? ORDER BY created_at DESC LIMIT 100`).all(status);
  } else {
    rows = db.prepare(`SELECT * FROM contents ORDER BY created_at DESC LIMIT 100`).all();
  }
  res.json(rows);
});

app.get('/api/performance', (req, res) => {
  const db = getDb();
  const days = parseInt(req.query.days) || 30;
  const summary = db.prepare(`
    SELECT date, 
      SUM(views) as views, SUM(clicks) as clicks, 
      SUM(cta_clicks) as cta_clicks, SUM(conversions) as conversions,
      SUM(revenue) as revenue, COUNT(*) as count
    FROM performance
    WHERE date >= date('now', ?)
    GROUP BY date ORDER BY date
  `).all(`-${days} days`);

  const totals = db.prepare(`
    SELECT 
      COALESCE(SUM(views),0) as total_views,
      COALESCE(SUM(clicks),0) as total_clicks,
      COALESCE(SUM(conversions),0) as total_conversions,
      COALESCE(SUM(revenue),0) as total_revenue,
      COUNT(DISTINCT content_id) as content_count
    FROM performance WHERE date >= date('now', ?)
  `).get(`-${days} days`);

  res.json({ daily: summary, totals });
});

app.get('/api/team', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(getTeamLogs(limit));
});

app.get('/api/stats', (req, res) => {
  const db = getDb();
  const counts = db.prepare(`
    SELECT status, COUNT(*) as cnt FROM contents GROUP BY status
  `).all();
  const total = db.prepare('SELECT COUNT(*) as cnt FROM contents').get();
  const todayPublished = db.prepare(`
    SELECT COUNT(*) as cnt FROM contents WHERE status='published' AND DATE(published_at)=date('now')
  `).get();
  res.json({ statusCounts: counts, total: total.cnt, todayPublished: todayPublished.cnt });
});

app.get('/api/funnel', (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const funnel = calculateFunnel({ days });
  const daily = dailyFunnel(parseInt(req.query.trend_days) || 14);
  res.json({ funnel, daily });
});

app.get('/api/cta-summary', (req, res) => {
  res.json(getCtaSummary());
});

app.get('/api/pipeline', (req, res) => {
  const db = getDb();
  const pipeline = db.prepare(`
    SELECT status, type, COUNT(*) as cnt
    FROM contents GROUP BY status, type ORDER BY status, type
  `).all();
  res.json(pipeline);
});

app.post('/api/contents/:id/approve', (req, res) => {
  try {
    const result = approve(parseInt(req.params.id), { role: req.body.role || 'ceo', note: req.body.note || '' });
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

app.post('/api/contents/:id/reject', (req, res) => {
  try {
    const result = reject(parseInt(req.params.id), { role: req.body.role || 'ceo', note: req.body.note || '' });
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

const PORT = 3200;
app.listen(PORT, () => {
  console.log(`🐾 멍냥바이럴 대시보드: http://localhost:${PORT}`);
});
