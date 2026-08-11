import { fetchKhonKaenWaterLevels, summarize } from './_lib/waterlevel.js';

// ── GET /api/waterlevel — สถานีวัดระดับน้ำในจังหวัดขอนแก่น (Thai Water API / สสน.) ──
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  // แคชที่ edge 5 นาที เพื่อลดโหลด Thai Water API ต้นทาง (ข้อมูลอัปเดตราวรายชั่วโมงอยู่แล้ว)
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');

  try {
    const stations = await fetchKhonKaenWaterLevels();
    const summary  = summarize(stations);
    res.status(200).json({
      ok: true,
      updatedAt: new Date().toISOString(),
      stations,
      summary,
    });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message ?? 'fetch failed' });
  }
}
