const ORS_KEY = process.env.ORS_KEY ?? process.env.VITE_ORS_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'Method not allowed' }); return; }

  if (!ORS_KEY) {
    res.status(503).json({ error: 'ยังไม่ได้ตั้งค่า ORS_KEY บนเซิร์ฟเวอร์' });
    return;
  }

  const { lat, lng, profile, minutes } = req.body ?? {};
  if (lat == null || lng == null || !profile || !Array.isArray(minutes) || minutes.length === 0) {
    res.status(400).json({ error: 'ข้อมูลไม่ครบ (ต้องการ lat, lng, profile, minutes)' });
    return;
  }

  try {
    const orsRes = await fetch(
      `https://api.openrouteservice.org/v2/isochrones/${profile}`,
      {
        method: 'POST',
        headers: { Authorization: ORS_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locations: [[lng, lat]],
          range: minutes.map(m => m * 60),
          range_type: 'time',
          smoothing: 0.5,
        }),
      }
    );

    const data = await orsRes.json().catch(() => ({}));
    if (!orsRes.ok) {
      res.status(orsRes.status).json({ error: data?.error?.message || `HTTP ${orsRes.status}` });
      return;
    }
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: 'เรียก openrouteservice ไม่สำเร็จ' });
  }
}
