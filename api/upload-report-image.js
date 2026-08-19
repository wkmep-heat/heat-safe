import { createClient } from '@supabase/supabase-js';

// ── อัปโหลดรูปประกอบการแจ้งเหตุขึ้น Supabase Storage แทน imgbb ────────────────
// เดิมใช้คีย์สาธารณะของ imgbb ซึ่งใช้ร่วมกับโปรเจกต์อื่นนับพันทั่วอินเทอร์เน็ต ทำให้
// โดนจำกัด/ล่มได้บ่อย — ย้ายมาใช้ Supabase Storage ที่โปรเจกต์นี้มี credential อยู่แล้ว
// (ตัวเดียวกับที่ api/notify.js ใช้) ไม่ต้องพึ่งบริการภายนอกอีกตัวหนึ่ง

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET = 'report-images';
let bucketReady = false;

// สร้าง bucket อัตโนมัติรอบแรกที่ใช้งาน — ไม่ต้องเข้าไปตั้งค่าใน Supabase dashboard เอง
async function ensureBucket() {
  if (bucketReady) return;
  try {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 8 * 1024 * 1024,
    });
  } catch { /* อาจมี bucket อยู่แล้ว หรือไม่มีสิทธิ์สร้าง — ปล่อยผ่าน ไปเจอ error ตอน upload แทน */ }
  bucketReady = true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return; }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    res.status(503).json({ error: 'ยังไม่ได้ตั้งค่า SUPABASE_URL/SUPABASE_SERVICE_KEY' });
    return;
  }

  const { image } = req.body ?? {};
  const match = typeof image === 'string' ? image.match(/^data:(image\/\w+);base64,(.+)$/) : null;
  if (!match) {
    res.status(400).json({ error: 'missing/invalid image (ต้องเป็น data URL รูปภาพ)' });
    return;
  }
  const [, mime, b64] = match;

  let buffer;
  try {
    buffer = Buffer.from(b64, 'base64');
  } catch {
    res.status(400).json({ error: 'decode base64 ไม่สำเร็จ' });
    return;
  }

  // รูปถูกย่อฝั่ง client เหลือสูงสุด ~800px แล้ว กันไว้อีกชั้นไม่ให้ payload ใหญ่เกินจำเป็น
  if (buffer.length > 8 * 1024 * 1024) {
    res.status(413).json({ error: 'ไฟล์รูปใหญ่เกินไป' });
    return;
  }

  try {
    await ensureBucket();

    const ext      = mime.split('/')[1] || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType: mime, upsert: false });

    if (upErr) {
      res.status(502).json({ error: upErr.message ?? 'upload ไม่สำเร็จ' });
      return;
    }

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    res.status(200).json({ ok: true, url: pub.publicUrl });
  } catch (e) {
    res.status(500).json({ error: e.message ?? 'upload failed' });
  }
}
