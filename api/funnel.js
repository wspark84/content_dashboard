export default function handler(req, res) {
  res.json({ funnel: { impressions: 0, clicks: 0, cta_clicks: 0, conversions: 0 }, daily: [] });
}
