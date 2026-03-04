import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://gznarqkmuafkxotljfzu.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6bmFycWttdWFma3hvdGxqZnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1Njc0NDIsImV4cCI6MjA4ODE0MzQ0Mn0.LJOomQJRuNNDbl1kc9IHkYLfV4sZR_xcwylnl9fXgP8'
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('performance')
      .select('*')
      .order('date', { ascending: false })
      .limit(30);
    if (error) throw error;

    const rows = data || [];
    const funnel = rows.reduce((acc, r) => ({
      impressions: acc.impressions + (r.views || 0),
      clicks: acc.clicks + (r.clicks || 0),
      cta_clicks: acc.cta_clicks + (r.cta_clicks || 0),
      conversions: acc.conversions + (r.conversions || 0),
    }), { impressions: 0, clicks: 0, cta_clicks: 0, conversions: 0 });

    res.json({ funnel, daily: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
