import { fetchKhonKaenWaterLevels, SITUATION_META } from './waterlevel.js';

// ── ตรวจสถานการณ์น้ำเทียบรอบก่อนหน้า + แจ้งเตือนผ่าน LINE OA เท่านั้น ─────────
// ใช้โดย api/notify-water.js ซึ่งมี cron อิสระของตัวเอง (ทุก 30 นาที บน Vercel
// Pro plan) — ไม่ส่ง web push แล้ว ส่งเฉพาะ LINE OA broadcast ทุกครั้งที่มี
// สถานีสถานการณ์แย่ลง (ไม่ใช่แค่กรณีวิกฤต เพราะตอนนี้ LINE เป็นช่องทางเดียว)

async function sendLineBroadcast(lineToken, title, body) {
  if (!lineToken) return { ok: false, skipped: true, reason: 'LINE_CHANNEL_TOKEN not set' };
  const text = `🚨 ${title}\n\n${body}\n\n— Heat Safe Khonkaen`;
  const lineRes = await fetch('https://api.line.me/v2/bot/message/broadcast', {
    method: 'POST',
    headers: { Authorization: `Bearer ${lineToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ type: 'text', text }] }),
  });
  if (!lineRes.ok) {
    const err = await lineRes.json().catch(() => ({}));
    return { ok: false, error: err.message ?? `LINE API ${lineRes.status}` };
  }
  return { ok: true };
}

function stationLine(s) {
  const sit = SITUATION_META[s.situationLevel]?.label ?? '—';
  const bank = s.diffBankText ? ` · ${s.diffBankText.includes('ล้นตลิ่ง') ? '🔴 ล้นตลิ่ง' : ''}${s.diffBankText} ${s.diffBank ?? ''}ม.` : '';
  return `${s.name} (${s.river ?? s.amphoe ?? ''}) — ${sit}${bank}`;
}

export async function checkAndNotifyWaterLevel({ supabase, lineToken }) {
  const stations = await fetchKhonKaenWaterLevels();

  const { data: stateRow } = await supabase
    .from('water_notification_state')
    .select('data')
    .eq('id', 1)
    .maybeSingle();
  const prevByCode   = stateRow?.data ?? {};
  const hasPrevState = Object.keys(prevByCode).length > 0;

  // ── หาสถานีที่ "สถานการณ์แย่ลง" เทียบกับรอบก่อนหน้า ──────────────────────
  const escalated = [];
  for (const s of stations) {
    const prev = prevByCode[s.code ?? s.name];
    if (hasPrevState) {
      const newlyOverBank     = s.isOverBank && !prev?.isOverBank;
      const situationWorsened = s.situationLevel >= 4 && (prev?.situationLevel ?? 0) < s.situationLevel;
      if (newlyOverBank || situationWorsened) escalated.push(s);
    }
  }

  // ── บันทึกสถานะล่าสุดไว้เทียบรอบถัดไปเสมอ (ไม่ว่าจะแจ้งเตือนหรือไม่) ───────
  const nextState = Object.fromEntries(
    stations.map(s => [s.code ?? s.name, { situationLevel: s.situationLevel, isOverBank: s.isOverBank }])
  );
  await supabase.from('water_notification_state').upsert({
    id: 1,
    data: nextState,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (!escalated.length) {
    return { ok: true, skipped: true, checked: stations.length, hasPrevState };
  }

  const critical = escalated.some(s => s.isOverBank || s.situationLevel >= 5);
  const title = critical ? '🌊 เฝ้าระวังน้ำท่วม · ขอนแก่น' : '🌊 ระดับน้ำเปลี่ยนแปลง · ขอนแก่น';
  const body  = escalated.slice(0, 3).map(stationLine).join('\n');

  const line = await sendLineBroadcast(lineToken, title, body);

  return {
    ok: true,
    escalated: escalated.map(s => ({ name: s.name, code: s.code, situationLevel: s.situationLevel, isOverBank: s.isOverBank })),
    line,
  };
}
