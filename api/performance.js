export default function handler(req, res) {
  res.json({ daily: [], totals: { total_views: 0, total_clicks: 0, total_conversions: 0, total_revenue: 0, content_count: 0 } });
}
