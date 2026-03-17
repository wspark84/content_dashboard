/**
 * 대시보드 API 확장 — 팀 권한 + 최적화 관련 라우트
 * dashboard/server.js에서 import하여 사용
 */
import { Router } from 'express';
import { getAllRoles, hasPermission } from './auth.js';
import { getTeamLogs } from './approval.js';
import { getRules } from '../optimize/learner.js';
import { getDb } from '../shared/db.js';

const router = Router();

// --- Auth ---

router.post('/api/auth/login', (req, res) => {
  const { role } = req.body || {};
  const roles = getAllRoles();
  const found = roles.find(r => r.role === role);
  if (!found) {
    return res.status(400).json({ ok: false, error: `알 수 없는 역할: ${role}`, availableRoles: roles.map(r => r.role) });
  }
  res.json({ ok: true, role: found.role, label: found.label, permissions: found.permissions });
});

// --- Team ---

router.get('/api/team/roles', (req, res) => {
  res.json(getAllRoles());
});

router.get('/api/team/activity', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(getTeamLogs(limit));
});

// --- Optimize ---

router.get('/api/optimize/rules', (req, res) => {
  res.json(getRules());
});

router.get('/api/optimize/ab-tests', (req, res) => {
  const db = getDb();
  try {
    const tests = db.prepare('SELECT * FROM ab_tests ORDER BY created_at DESC').all();
    res.json(tests);
  } catch {
    res.json([]);
  }
});

router.post('/api/optimize/ab-tests', (req, res) => {
  const { name, variant_a, variant_b, metric } = req.body || {};
  if (!name) return res.status(400).json({ ok: false, error: 'name 필수' });

  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS ab_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      variant_a TEXT,
      variant_b TEXT,
      metric TEXT DEFAULT 'views',
      status TEXT DEFAULT 'running',
      winner TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT
    )
  `);

  const info = db.prepare(
    `INSERT INTO ab_tests (name, variant_a, variant_b, metric) VALUES (?,?,?,?)`
  ).run(name, variant_a || '', variant_b || '', metric || 'views');

  res.json({ ok: true, id: info.lastInsertRowid });
});

export { router as teamApiRouter };
