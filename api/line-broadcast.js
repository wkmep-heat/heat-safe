const LINE_TOKEN = process.env.LINE_CHANNEL_TOKEN;
const ADMIN_PIN  = process.env.ADMIN_PIN ?? '2569';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return; }

  const { pin, title, body, imageUrl } = req.body ?? {};

  if (!pin || String(pin) !== String(ADMIN_PIN)) {
    res.status(401).json({ error: 'รหัสไม่ถูกต้อง' });
    return;
  }
  if (!title?.trim() || !body?.trim()) {
    res.status(400).json({ error: 'กรุณากรอกหัวข้อและข้อความ' });
    return;
  }
  if (!LINE_TOKEN) {
    res.status(503).json({ error: 'ยังไม่ได้ตั้งค่า LINE_CHANNEL_TOKEN' });
    return;
  }

  const text = `🚨 ${title.trim()}\n\n${body.trim()}\n\n— ระบบติดตามสภาพแวดล้อม จ.ขอนแก่น`;

  const messages = [{ type: 'text', text }];
  if (imageUrl) {
    messages.push({
      type: 'image',
      originalContentUrl: imageUrl,
      previewImageUrl:    imageUrl,
    });
  }

  const lineRes = await fetch('https://api.line.me/v2/bot/message/broadcast', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LINE_TOKEN}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ messages }),
  });

  if (!lineRes.ok) {
    const err = await lineRes.json().catch(() => ({}));
    res.status(500).json({ error: err.message ?? 'LINE API error', details: err });
    return;
  }

  res.status(200).json({ ok: true });
}
