#!/usr/bin/env node
/**
 * SQLite → Supabase 동기화 스크립트
 */
import Database from 'better-sqlite3';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, '..', 'data', 'mungnyang.db');

const SUPABASE_URL = 'https://gznarqkmuafkxotljfzu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6bmFycWttdWFma3hvdGxqZnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Njc0NDIsImV4cCI6MjA4ODE0MzQ0Mn0.LJOomQJRuNNDbl1kc9IHkYLfV4sZR_xcwylnl9fXgP8';

// Tables with GENERATED ALWAYS id columns - strip id before upsert
const AUTO_ID_TABLES = new Set([
  'trending_topics', 'contents', 'performance', 'ab_tests', 'team_logs', 'learned_rules'
]);

// Fix malformed timestamps (e.g. "00:08", "03.03")
function fixTimestamp(val) {
  if (!val || typeof val !== 'string') return val;
  // Already valid ISO-ish
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val;
  // Time only like "00:08" → prefix with today
  if (/^\d{2}:\d{2}$/.test(val)) return `2026-03-03 ${val}:00`;
  // Date like "03.03" → convert
  if (/^\d{2}\.\d{2}$/.test(val)) return `2026-${val.replace('.', '-')}T00:00:00`;
  return val;
}

function cleanRow(table, row) {
  const cleaned = { ...row };
  
  // Strip auto-generated id
  if (AUTO_ID_TABLES.has(table)) {
    delete cleaned.id;
  }

  // Fix timestamp fields
  for (const key of ['published_at', 'crawled_at', 'created_at', 'started_at', 'ended_at', 'updated_at']) {
    if (key in cleaned) {
      cleaned[key] = fixTimestamp(cleaned[key]);
    }
  }

  return cleaned;
}

async function upsertToSupabase(table, rows) {
  if (rows.length === 0) return { count: 0, status: 'empty' };

  const cleaned = rows.map(r => cleanRow(table, r));
  const BATCH = 500;
  let total = 0;

  for (let i = 0; i < cleaned.length; i += BATCH) {
    const batch = cleaned.slice(i, i + BATCH);
    
    // For auto-id tables, use regular insert (ignore duplicates)
    const prefer = AUTO_ID_TABLES.has(table)
      ? 'return=minimal,resolution=ignore-duplicates'
      : 'return=minimal,resolution=merge-duplicates';

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': prefer,
      },
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${table} upsert failed (${res.status}): ${text}`);
    }
    total += batch.length;
  }

  return { count: total, status: 'ok' };
}

async function main() {
  console.log(`📂 DB: ${DB_PATH}`);
  const db = new Database(DB_PATH);
  const results = {};
  const tables = ['raw_posts', 'trending_topics', 'contents', 'performance', 'ab_tests', 'team_logs', 'learned_rules'];

  for (const table of tables) {
    const rows = db.prepare(`SELECT * FROM ${table}`).all();
    console.log(`📊 ${table}: ${rows.length} rows`);
    try {
      const result = await upsertToSupabase(table, rows);
      results[table] = result;
      console.log(`  ✅ synced ${result.count} rows`);
    } catch (err) {
      results[table] = { count: 0, status: 'error', error: err.message };
      console.error(`  ❌ ${err.message}`);
    }
  }

  db.close();
  console.log('\n📋 동기화 결과:');
  for (const [t, r] of Object.entries(results)) {
    console.log(`  ${r.status === 'ok' ? '✅' : r.status === 'empty' ? '⬜' : '❌'} ${t}: ${r.count} rows ${r.error || ''}`);
  }
}

main().catch(console.error);
