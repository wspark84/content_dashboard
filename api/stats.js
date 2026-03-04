import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://gznarqkmuafkxotljfzu.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6bmFycWttdWFma3hvdGxqZnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Njc0NDIsImV4cCI6MjA4ODE0MzQ0Mn0.LJOomQJRuNNDbl1kc9IHkYLfV4sZR_xcwylnl9fXgP8'
);

export default async function handler(req, res) {
  try {
    const { count: total } = await supabase.from('contents').select('*', { count: 'exact', head: true });
    const { count: todayPublished } = await supabase
      .from('contents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', new Date().toISOString().slice(0, 10));

    const { data: statusData } = await supabase.from('contents').select('status');
    const counts = {};
    (statusData || []).forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
    const statusCounts = Object.entries(counts).map(([status, count]) => ({ status, count }));

    res.json({ statusCounts, total: total || 0, todayPublished: todayPublished || 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
