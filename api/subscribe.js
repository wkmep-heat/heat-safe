import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  if (!supabase) {
    res.status(503).json({ error: 'Supabase not configured' });
    return;
  }

  const { subscription, action = 'subscribe' } = req.body ?? {};
  if (!subscription?.endpoint) {
    res.status(400).json({ error: 'Missing subscription' });
    return;
  }

  if (action === 'unsubscribe') {
    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
    res.status(200).json({ ok: true });
    return;
  }

  // Upsert subscription
  const { error } = await supabase.from('push_subscriptions').upsert({
    endpoint: subscription.endpoint,
    p256dh:   subscription.keys.p256dh,
    auth:     subscription.keys.auth,
  }, { onConflict: 'endpoint' });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ ok: true });
}
