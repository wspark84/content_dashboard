import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'NOT_SET';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'NOT_SET';
  
  const info = {
    env_url: url,
    env_key: key ? key.substring(0, 20) + '...' : 'NOT_SET',
    all_supabase_envs: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
  };

  try {
    const supabase = createClient(url, key);
    const { data, error, count } = await supabase
      .from('trending_topics')
      .select('id,keyword,score', { count: 'exact' })
      .limit(3);
    info.data = data;
    info.error = error;
    info.count = count;
  } catch (e) {
    info.exception = e.message;
  }

  res.json(info);
}
