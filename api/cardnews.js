// 카드뉴스 통합 API (ideas + generate + outputs)
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.SUPABASE_URL || 'https://gznarqkmuafkxotljfzu.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6bmFycWttdWFma3hvdGxqZnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Njc0NDIsImV4cCI6MjA4ODE0MzQ0Mn0.LJOomQJRuNNDbl1kc9IHkYLfV4sZR_xcwylnl9fXgP8'
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const action = req.query.action;

  try {
    if (req.method === 'GET' && action === 'ideas') {
      const status = req.query.status || 'pending';
      const { data, error } = await sb.from('cardnews_ideas').select('*').eq('status', status).order('viral_score', { ascending: false });
      if (error) throw error;
      return res.json(data);
    }

    if (req.method === 'GET' && action === 'outputs') {
      const idea_id = req.query.idea_id;
      let q = sb.from('cardnews_outputs').select('*').order('card_number');
      if (idea_id) q = q.eq('idea_id', idea_id);
      const { data, error } = await q;
      if (error) throw error;
      return res.json(data);
    }

    if (req.method === 'POST' && action === 'select') {
      const { id } = req.body;
      const { error } = await sb.from('cardnews_ideas').update({ status: 'selected' }).eq('id', id);
      if (error) throw error;
      return res.json({ ok: true });
    }

    if (req.method === 'POST' && action === 'reject') {
      const { id } = req.body;
      const { error } = await sb.from('cardnews_ideas').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
      return res.json({ ok: true });
    }

    if (req.method === 'POST' && action === 'generate') {
      const { id } = req.body;
      const { error } = await sb.from('cardnews_ideas').update({ status: 'generating' }).eq('id', id);
      if (error) throw error;
      return res.json({ ok: true, message: 'Generation triggered' });
    }

    if (req.method === 'POST' && action === 'add') {
      const ideas = req.body.ideas || [req.body];
      const { data, error } = await sb.from('cardnews_ideas').insert(ideas);
      if (error) throw error;
      return res.json({ ok: true, data });
    }

    return res.status(400).json({ error: 'Invalid action. Use: ideas, outputs, select, reject, generate, add' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
