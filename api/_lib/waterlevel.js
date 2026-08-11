// ── Shared helper: ระดับน้ำจังหวัดขอนแก่น จาก Thai Water API (สสน. / HII) ──────
// ใช้ร่วมกันระหว่าง api/waterlevel.js (public endpoint) และ api/notify-water.js (cron)

const THAIWATER_URL = 'https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load';
const PROVINCE_TH   = 'ขอนแก่น';

// สถานการณ์น้ำ 5 ระดับ ตามที่ Thai Water จัดกลุ่ม (เทียบสถิติย้อนหลังของแต่ละสถานี)
export const SITUATION_META = {
  1: { label: 'น้ำน้อยวิกฤต', short: 'น้ำน้อยมาก', color: '#b45309', severity: 1 },
  2: { label: 'น้ำน้อย',       short: 'น้ำน้อย',     color: '#ca8a04', severity: 1 },
  3: { label: 'ปกติ',          short: 'ปกติ',        color: '#16a34a', severity: 0 },
  4: { label: 'น้ำมาก',        short: 'น้ำมาก',      color: '#ea580c', severity: 2 },
  5: { label: 'น้ำมากวิกฤต',   short: 'วิกฤต',       color: '#dc2626', severity: 3 },
};

function toNum(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

// ── ดึง + กรอง + จัดรูปแบบสถานีวัดระดับน้ำในจังหวัดขอนแก่น ──────────────────
export async function fetchKhonKaenWaterLevels() {
  const res  = await fetch(THAIWATER_URL);
  if (!res.ok) throw new Error(`Thai Water API ${res.status}`);
  const json = await res.json();
  const rows = json?.waterlevel_data?.data ?? [];

  // มีข้อมูลซ้ำสองชุดต่อสถานี (ชุดจาก ชป./สสน. ที่รวม situation_level กับชุด
  // duplicate "ridhydro_" ที่ไม่มี situation_level/river) — ใช้เฉพาะชุดที่สมบูรณ์
  const stations = rows
    .filter(r =>
      r.station_type === 'tele_waterlevel' &&
      r.geocode?.province_name?.th === PROVINCE_TH &&
      r.situation_level != null
    )
    .map(r => {
      const st         = r.station ?? {};
      const bankText   = r.diff_wl_bank_text ?? '';
      const isOverBank = bankText.includes('ล้นตลิ่ง');
      const diffBank   = toNum(r.diff_wl_bank);
      return {
        id:            String(r.id),
        stationId:     st.id != null ? String(st.id) : null,
        code:          st.tele_station_oldcode ?? null,
        name:          st.tele_station_name?.th ?? 'ไม่ทราบชื่อสถานี',
        lat:           st.tele_station_lat ?? null,
        lng:           st.tele_station_long ?? null,
        river:         r.river_name ?? null,
        amphoe:        r.geocode?.amphoe_name?.th ?? null,
        agency:        r.agency?.agency_shortname?.th ?? null,
        datetime:      r.waterlevel_datetime ?? null,
        waterLevelMsl: toNum(r.waterlevel_msl),
        situationLevel: r.situation_level,
        diffBank,
        diffBankText:  bankText || null,
        isOverBank,
        // ระดับความเสี่ยงรวม 0-3 ใช้จัดอันดับ/สี: บวก 1 ทันทีถ้าล้นตลิ่งจริง แม้ situation_level จะยังไม่ขึ้นระดับ 5
        riskLevel: Math.max(
          SITUATION_META[r.situation_level]?.severity ?? 0,
          isOverBank ? 3 : 0
        ),
      };
    })
    // สถานีเดียวกันบางครั้งมีมากกว่า 1 แถว (คนละ id แต่ code ซ้ำ) — เก็บแถวล่าสุดต่อ code/name
    .reduce((acc, s) => {
      const key = s.code ?? s.name;
      const prev = acc.get(key);
      if (!prev || (s.datetime ?? '') > (prev.datetime ?? '')) acc.set(key, s);
      return acc;
    }, new Map());

  return [...stations.values()].sort((a, b) => b.riskLevel - a.riskLevel);
}

export function summarize(stations) {
  if (!stations.length) return { worstRisk: 0, worstStation: null, overBankCount: 0 };
  const worst = stations[0]; // เรียงมาแล้วจาก riskLevel มาก→น้อย
  return {
    worstRisk:    worst.riskLevel,
    worstStation: worst,
    overBankCount: stations.filter(s => s.isOverBank).length,
  };
}
