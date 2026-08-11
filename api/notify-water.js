import { createClient } from '@supabase/supabase-js';
import { checkAndNotifyWaterLevel } from './_lib/waterNotify.js';

const LINE_TOKEN = process.env.LINE_CHANNEL_TOKEN;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── Main handler (เรียกโดย Vercel Cron ทุก 30 นาที — ต้องใช้ Vercel Pro ขึ้นไป) ──
// แจ้งเตือนระดับน้ำผ่าน LINE OA เท่านั้น ไม่ใช้ web push
export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const result = await checkAndNotifyWaterLevel({ supabase, lineToken: LINE_TOKEN });
    res.status(200).json(result);
  } catch (err) {
    res.status(502).json({ error: err.message ?? 'water level check failed' });
  }
}
