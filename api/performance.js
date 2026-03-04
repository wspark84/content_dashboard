import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://gznarqkmuafkxotljfzu.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6bmFycWttdWFma3hvdGxqZnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Njc0NDIsImV4cCI6MjA4ODE0MzQ0Mn0.LJOomQJRuNNDbl1kc9IHkYLfV4sZR_xcwylnl9fXgP8'
);

export default async function handler(req, res) {
  try {
    const { data: daily, error: e1 } = await supabase
      .from('performance')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);
    if (e1) throw e1;

    const totals = (daily || []).reduce((acc, r) => ({
      total_views: acc.total_views + (r.views || 0),
      total_clicks: acc.total_clicks + (r.clicks || 0),
      total_conversions: acc.total_conversions + (r.conversions || 0),
      total_revenue: acc.total_revenue + (r.revenue || 0),
    }), { total_views: 0, total_clicks: 0, total_conversions: 0, total_revenue: 0 });

    const { count } = await supabase.from('contents').select('*', { count: 'exact', head: true });
    totals.content_count = count || 0;

    res.json({ daily: daily || [], totals });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
