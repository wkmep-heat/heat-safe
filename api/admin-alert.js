import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const VAPID_PUBLIC  = 'BPK1ArKe9auD9PmUHEyqKDJv-Y_tucS3I73HCpGIIZSskw2_FnvxKqYxk2I4V9nVROtEtQbLDBdr63cAkMx1UnY';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL   = process.env.VAPID_EMAIL ?? 'mailto:admin@kkmap.app';
// PIN stored server-side only — never exposed to frontend bundle
const ADMIN_PIN     = process.env.ADMIN_PIN ?? '2569';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { pin, title, body, severity = 'warning' } = req.body ?? {};

  // ── PIN check ────────────────────────────────────────────────────────────
  if (!pin || String(pin) !== String(ADMIN_PIN)) {
    // Intentionally vague — don't hint that the endpoint exists
    res.status(401).json({ error: 'รหัสไม่ถูกต้อง' });
    return;
  }

  if (!title?.trim() || !body?.trim()) {
    res.status(400).json({ error: 'กรุณากรอกหัวข้อและข้อความ' });
    return;
  }

  const missing = [
    !VAPID_PRIVATE             && 'VAPID_PRIVATE_KEY',
    !process.env.SUPABASE_URL  && 'SUPABASE_URL',
    !process.env.SUPABASE_SERVICE_KEY && 'SUPABASE_SERVICE_KEY',
  ].filter(Boolean);

  if (missing.length) {
    res.status(503).json({ error: `ยังไม่ได้ตั้งค่า: ${missing.join(', ')}` });
    return;
  }

  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data: subs, error: dbErr } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth');

  if (dbErr) {
    res.status(500).json({ error: `Supabase error: ${dbErr.message}` });
    return;
  }

  if (!subs?.length) {
    res.status(200).json({ ok: true, sent: 0, message: 'ไม่มีผู้ติดตามที่เปิดการแจ้งเตือน' });
    return;
  }

  const severityEmoji = {
    info:     'ℹ️',
    warning:  '⚠️',
    danger:   '🚨',
    critical: '🆘',
  }[severity] ?? '⚠️';

  const payload = JSON.stringify({
    title: `${severityEmoji} ${title.trim()}`,
    body:  body.trim(),
    url:   '/',
  });

  const results = await Promise.allSettled(
    subs.map(s =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      ).catch(async err => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        }
        throw err;
      })
    )
  );

  const sent   = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  res.status(200).json({ ok: true, sent, failed, total: subs.length });
}
