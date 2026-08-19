import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const VAPID_PUBLIC  = 'BPK1ArKe9auD9PmUHEyqKDJv-Y_tucS3I73HCpGIIZSskw2_FnvxKqYxk2I4V9nVROtEtQbLDBdr63cAkMx1UnY';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL   = process.env.VAPID_EMAIL ?? 'mailto:admin@kkmap.app';
const LINE_TOKEN = process.env.LINE_CHANNEL_TOKEN;
const KK_LAT  = 16.4322;
const KK_LNG  = 102.8359;
const KK_WMO  = '48381';

// Scheduled notification hours (ICT) — เช้า / เที่ยง / เย็น
// หมายเหตุ: ยิงโดย GitHub Actions (.github/workflows/notify.yml) ซึ่ง schedule trigger
// ของ GitHub ไม่ตรงนาทีเป๊ะ (ดีเลย์ได้หลายนาทีถึงหลักสิบนาที) จึงเช็กแค่ "ชั่วโมงตรง +
// ยังไม่เคยส่งของชั่วโมงนี้วันนี้" แทนการเทียบนาทีเป๊ะแบบ Vercel Cron เดิม
const SCHEDULED_HOURS = [7, 12, 17];

// ── ช่วงเวลาของวัน สำหรับใช้ในข้อความแจ้งเตือน (เช้านี้ / เที่ยงนี้ / เย็นนี้ ...) ──
function resolvePeriod(hour) {
  if (hour >= 19 || hour < 5) return 'คืนนี้';
  if (hour < 11) return 'เช้า';
  if (hour < 14) return 'เที่ยง';
  return 'เย็น';
}

// ── เกณฑ์ "สภาพอากาศวิกฤต" — แจ้งเตือนทันทีไม่ว่าจะถึงรอบเช้า/เที่ยง/เย็นหรือไม่ ──
const HEAT_CRITICAL = 42; // °C ดัชนีความร้อน/รู้สึกเหมือน ระดับ "อันตราย"
const RAIN_CRITICAL = 35; // มม. ฝนตกหนัก (เกณฑ์ TMD)
const PM25_CRITICAL = 91; // มคก./ลบ.ม. ฝุ่นระดับสีแดง
const UV_CRITICAL   = 11; // ดัชนี UV ระดับ "อันตราย"

// true เมื่อค่าปัจจุบันข้าม threshold ขึ้นไป และรอบก่อนหน้ายังไม่ถึง (กันแจ้งซ้ำทุกรอบ)
function crossedUp(current, previous, threshold) {
  if (current == null || current < threshold) return false;
  return previous == null || previous < threshold;
}

// ── สรุปสภาพอากาศปัจจุบันเป็นประโยคสั้นๆ พร้อมอิโมจิ ────────────────────────
function weatherPhrase(data) {
  const { temp, feelsLike, uvIndex, rainfall, precipProb, pm25 } = data;

  const heavyRain = (rainfall != null && rainfall > 5) || (precipProb != null && precipProb >= 70);
  const lightRain = !heavyRain && ((rainfall != null && rainfall > 0) || (precipProb != null && precipProb >= 40));
  const veryHot   = (feelsLike ?? temp ?? 0) >= 40;
  const hot       = !veryHot && temp != null && temp >= 35;
  const highUV    = uvIndex != null && uvIndex >= 8;
  const dusty     = pm25 != null && pm25 >= 50;
  const cool      = temp != null && temp <= 22;

  if (heavyRain) {
    const amt = rainfall != null && rainfall > 0 ? `${rainfall} มม. ` : '';
    return { emoji: '🌧️', text: `มีฝนตก${amt}อย่าลืมพกร่มนะ` };
  }
  if (lightRain) {
    return { emoji: '🌦️', text: 'อาจมีฝนตกเล็กน้อย อย่าลืมพกร่มไว้ก่อนนะ' };
  }
  if (veryHot) {
    return { emoji: '🥵', text: 'อากาศร้อนจัด ดื่มน้ำเยอะๆ และเลี่ยงแดดจ้านะ' };
  }
  if (hot) {
    return { emoji: '🌡️', text: 'อากาศร้อน ดื่มน้ำเยอะๆ นะ' };
  }
  if (highUV) {
    return { emoji: '☀️', text: 'แดดแรง ทาครีมกันแดดก่อนออกจากบ้านนะ' };
  }
  if (dusty) {
    return { emoji: '😷', text: `ฝุ่น PM2.5 ขึ้นสูง (${Math.round(pm25)} มคก./ลบ.ม.) ใส่หน้ากากป้องกันด้วยนะ` };
  }
  if (cool) {
    return { emoji: '🌥️', text: 'อากาศเย็นสบาย' };
  }
  return { emoji: '🌤️', text: 'อากาศดี' };
}

// UV levels: 3=ปานกลาง, 6=สูง, 8=สูงมาก, 11=อันตราย
const UV_LEVELS = [
  { min: 11, label: 'อันตราย' },
  { min:  8, label: 'สูงมาก' },
  { min:  6, label: 'สูง' },
  { min:  3, label: 'ปานกลาง' },
];

// ตั้งค่า VAPID เฉพาะตอนมีคีย์ — ถ้าใช้ LINE อย่างเดียวไม่ตั้ง VAPID_PRIVATE_KEY ก็ยังต้อง
// import module นี้ได้โดยไม่ throw
if (VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

// สร้าง client แบบกันพัง — ถ้า SUPABASE_URL/KEY หายหรือผิดรูปแบบ createClient() จะ throw
// ทันทีตอน import module ทำให้ทั้งฟังก์ชัน crash เป็น FUNCTION_INVOCATION_FAILED (ไม่ใช่ JSON
// error ที่อ่านออก) จับไว้ตรงนี้แทน แล้วให้ handler ตอบ 503 ที่สื่อความหมายได้แทน
let supabase = null;
try {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
} catch { /* จัดการที่ handler ด้านล่าง */ }

// ── XML helper (Node.js has no DOMParser) ───────────────────────────────────
function xmlVal(block, tag) {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return m ? m[1].trim() : null;
}

// ── Fetch + parse TMD 3-hour observation for station 48381 ──────────────────
async function fetchTMD() {
  const xml = await fetch(
    'https://data.tmd.go.th/api/Weather3Hours/v2/?uid=api&ukey=api12345'
  ).then(r => r.text());

  const blocks = xml.split('<Station>').slice(1);
  for (const b of blocks) {
    if (/WmoStationNumber[^>]*>[\s]*48381[\s]*</.test(b)) {
      const num = t => { const v = parseFloat(xmlVal(b, t)); return isNaN(v) ? null : v; };
      return {
        temperature: num('Temperature'),
        humidity:    num('RelativeHumidity'),
        windSpeed:   num('WindSpeed'),
        windDir:     num('WindDirection'),
        rainfall:    num('Rainfall'),
        pressure:    num('MeanSeaLevelPressure'),
      };
    }
  }
  return null;
}

// ── Fetch UV index, precipitation probability + PM2.5 from Open-Meteo ───────
async function fetchOpenMeteo() {
  const ictNow  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const ictHour = ictNow.getHours();

  const [wxRes, aqRes] = await Promise.allSettled([
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${KK_LAT}&longitude=${KK_LNG}` +
      `&current=temperature_2m,apparent_temperature,uv_index` +
      `&hourly=precipitation_probability&timezone=Asia%2FBangkok&forecast_hours=24`
    ).then(r => r.json()),
    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${KK_LAT}&longitude=${KK_LNG}` +
      `&current=pm2_5&timezone=Asia%2FBangkok`
    ).then(r => r.json()),
  ]);

  const wx = wxRes.status === 'fulfilled' ? wxRes.value : null;
  return {
    temperature: wx?.current?.temperature_2m        ?? null,
    feelsLike:   wx?.current?.apparent_temperature  ?? null,
    uvIndex:     wx?.current?.uv_index              ?? null,
    precipProb:  wx?.hourly?.precipitation_probability?.[ictHour] ?? null,
    pm25:        aqRes.status === 'fulfilled' ? (aqRes.value.current?.pm2_5 ?? null) : null,
  };
}

// ── Fetch TMD weather warnings for Northeast / Khon Kaen ───────────────────
async function fetchTMDWarnings() {
  const alerts = [];
  try {
    // Try TMD weather warning API (XML)
    const xml = await fetch(
      'https://data.tmd.go.th/api/WeatherWarning3Hours/v2/?uid=api&ukey=api12345'
    ).then(r => r.text());

    // Look for warnings mentioning Northeast or Khon Kaen
    const kw = ['ขอนแก่น', 'ตะวันออกเฉียงเหนือ', 'ภาคอีสาน', 'northeast', 'khon kaen'];
    const blocks = xml.split('<Warning>').slice(1);
    for (const b of blocks) {
      const text = xmlVal(b, 'WarningText') ?? xmlVal(b, 'Description') ?? '';
      if (kw.some(k => text.toLowerCase().includes(k.toLowerCase()))) {
        alerts.push(text.slice(0, 800));
      }
    }
  } catch { /* ignore — warning API may not be available */ }
  return alerts;
}

// ── Build notification payload from current conditions ──────────────────────
// ลำดับความสำคัญ: ประกาศเตือนภัย TMD > สภาพอากาศวิกฤต (ร้อน/ฝนหนัก/ฝุ่น/UV) >
// UV ขึ้นระดับปานกลาง > ข้อความตามรอบเช้า/เที่ยง/เย็นปกติ — ส่งได้ทีละ 1 เรื่องต่อรอบ
function buildNotification(data, reasons, period) {
  const { temp, feelsLike, uvIndex, rainfall, pm25 } = data;
  const tempStr   = temp != null ? `${Math.round(temp)}°C` : '--';
  const feelsStr  = feelsLike != null ? `${Math.round(feelsLike)}°C` : tempStr;

  const builders = {
    warning: () => ({
      title: '🌪️ เตือนภัยอากาศ TMD · ขอนแก่น',
      body:  data.warnings?.[0] ?? 'มีประกาศเตือนภัยสภาพอากาศในพื้นที่ขอนแก่น',
    }),

    heat_critical: () => ({
      title: '🚨 อากาศร้อนอันตราย · ขอนแก่น',
      body:  `${period}นี้อุณหภูมิ ${tempStr} รู้สึกเหมือน ${feelsStr} ร้อนถึงระดับอันตราย งดกิจกรรมกลางแจ้งและดื่มน้ำบ่อยๆ นะ`,
    }),

    rain_critical: () => ({
      title: '🚨 ฝนตกหนัก · ขอนแก่น',
      body:  `${period}นี้มีฝนตกหนัก ${rainfall} มม. ระวังน้ำท่วมขังและน้ำป่าไหลหลาก งดเดินทางหากไม่จำเป็นนะ`,
    }),

    pm25_critical: () => ({
      title: '🚨 ฝุ่น PM2.5 วิกฤต · ขอนแก่น',
      body:  `${period}นี้ฝุ่น PM2.5 สูงถึง ${Math.round(pm25)} มคก./ลบ.ม. (ระดับสีแดง) หลีกเลี่ยงกิจกรรมกลางแจ้งและใส่หน้ากาก N95 นะ`,
    }),

    uv_extreme: () => ({
      title: '🚨 UV อันตราย · ขอนแก่น',
      body:  `${period}นี้ดัชนี UV สูงถึงระดับอันตราย (${Math.round(uvIndex)}) หลีกเลี่ยงแดดจัดช่วง 10.00-16.00 น. นะ`,
    }),

    uv_alert: () => {
      const uvLevel = uvIndex != null ? (UV_LEVELS.find(l => uvIndex >= l.min)?.label ?? 'ต่ำ') : 'ต่ำ';
      const { text } = weatherPhrase(data);
      return {
        title: `☀️ UV ขึ้นระดับ${uvLevel} · ขอนแก่น`,
        body:  `${period}นี้อุณหภูมิ ${tempStr} UV ${Math.round(uvIndex)} (${uvLevel}) ${text}`,
      };
    },

    scheduled: () => {
      const { emoji, text } = weatherPhrase(data);
      return {
        title: `${emoji} อากาศ${period}นี้ · ขอนแก่น`,
        body:  `${period}นี้อุณหภูมิ ${tempStr} ${text}`,
      };
    },
  };

  const priority = ['warning', 'heat_critical', 'rain_critical', 'pm25_critical', 'uv_extreme', 'uv_alert', 'scheduled'];
  const matched  = priority.find(r => reasons.includes(r));
  return builders[matched]();
}

// ── Send push to all subscribers ────────────────────────────────────────────
async function sendToAll(notification) {
  if (!VAPID_PRIVATE) return { sent: 0, failed: 0, skipped: true };

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth');
  if (!subs?.length) return { sent: 0, failed: 0 };

  const payload = JSON.stringify({ ...notification, url: '/' });
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
  return {
    sent:   results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
  };
}

// ── Broadcast ไปยัง LINE OA ─────────────────────────────────────────────────
async function sendLineBroadcast(notification) {
  if (!LINE_TOKEN) return { ok: false, skipped: true, reason: 'LINE_CHANNEL_TOKEN not set' };

  const text = `${notification.title}\n\n${notification.body}`;
  const lineRes = await fetch('https://api.line.me/v2/bot/message/broadcast', {
    method:  'POST',
    headers: { Authorization: `Bearer ${LINE_TOKEN}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ messages: [{ type: 'text', text }] }),
  });

  if (!lineRes.ok) {
    const err = await lineRes.json().catch(() => ({}));
    return { ok: false, error: err.message ?? `LINE API ${lineRes.status}` };
  }
  return { ok: true };
}

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Verify Vercel cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!supabase) {
    res.status(503).json({ error: 'Supabase ยังไม่ได้ตั้งค่าถูกต้อง — ตรวจสอบ SUPABASE_URL/SUPABASE_SERVICE_KEY บน Vercel' });
    return;
  }

  if (!VAPID_PRIVATE && !LINE_TOKEN) {
    res.status(503).json({ error: 'ยังไม่ได้ตั้งค่า VAPID_PRIVATE_KEY หรือ LINE_CHANNEL_TOKEN เลยสักอัน' });
    return;
  }

  // Current ICT time
  const ictNow    = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const ictHour   = ictNow.getHours();
  const ictMinute = ictNow.getMinutes();

  // ── Fetch all data in parallel ───────────────────────────────────────────
  const [tmd, omData, warnings, stateRow] = await Promise.allSettled([
    fetchTMD(),
    fetchOpenMeteo(),
    fetchTMDWarnings(),
    supabase.from('notification_state').select('*').eq('id', 1).maybeSingle(),
  ]);

  const tmdData  = tmd.status      === 'fulfilled' ? tmd.value      : null;
  const om       = omData.status   === 'fulfilled' ? omData.value   : {};
  const warnList = warnings.status === 'fulfilled' ? warnings.value : [];
  const prevState = stateRow.status === 'fulfilled' ? stateRow.value?.data : null;

  const data = {
    temp:       tmdData?.temperature ?? om.temperature ?? null,
    humidity:   tmdData?.humidity    ?? null,
    windSpeed:  tmdData?.windSpeed   ?? null,
    rainfall:   tmdData?.rainfall    ?? null,
    feelsLike:  om.feelsLike  ?? null,
    uvIndex:    om.uvIndex    ?? null,
    precipProb: om.precipProb ?? null,
    pm25:       om.pm25       ?? null,
    warnings:   warnList,
  };

  // ── Determine whether to send ────────────────────────────────────────────
  const reasons = [];

  // 1. Severe weather warning from TMD (new warning not yet sent)
  if (warnList.length > 0 && warnList[0] !== prevState?.last_warning) {
    reasons.push('warning');
  }

  // 2. UV threshold alert — triggered when UV crosses into moderate (3) or higher
  const { uvIndex } = data;
  const prevUV = prevState?.uv_index ?? null;
  if (uvIndex != null && prevUV != null && prevUV < 3 && uvIndex >= 3) {
    reasons.push('uv_alert');
  }

  // 3. สภาพอากาศวิกฤต — แจ้งทันทีที่ค่าข้ามเกณฑ์อันตราย ไม่ต้องรอรอบเช้า/เที่ยง/เย็น
  // หมายเหตุ: ตาราง notification_state ไม่มีคอลัมน์ feels_like จึงเทียบค่าก่อนหน้า
  // ด้วย temp ที่บันทึกไว้เดิม (ไม่ต้องแก้ schema)
  const currentHeat = data.feelsLike ?? data.temp;
  const prevHeat     = prevState?.temp ?? null;
  if (crossedUp(currentHeat, prevHeat, HEAT_CRITICAL))               reasons.push('heat_critical');
  if (crossedUp(data.rainfall, prevState?.rainfall ?? null, RAIN_CRITICAL)) reasons.push('rain_critical');
  if (crossedUp(data.pm25, prevState?.pm25 ?? null, PM25_CRITICAL))  reasons.push('pm25_critical');
  if (crossedUp(uvIndex, prevUV, UV_CRITICAL))                       reasons.push('uv_extreme');

  // 4. Scheduled hour — ส่งแค่ครั้งเดียวต่อชั่วโมงเป้าหมาย เทียบจาก notified_at เดิม
  // (ไม่เทียบนาทีเป๊ะ เพราะ GitHub Actions schedule อาจดีเลย์ได้หลายนาที) ถ้ามีการแจ้งเตือน
  // เรื่องอื่น (วิกฤต/UV/เตือนภัย) ไปแล้วในชั่วโมงเดียวกัน ก็ถือว่าผู้ใช้ได้รับแจ้งแล้ว ไม่ต้องซ้ำ
  const isTargetHour = SCHEDULED_HOURS.includes(ictHour);
  const prevNotifiedAt = prevState?.notified_at ? new Date(prevState.notified_at) : null;
  const prevICT = prevNotifiedAt
    ? new Date(prevNotifiedAt.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
    : null;
  const alreadyNotifiedThisHour = prevICT
    && prevICT.getFullYear() === ictNow.getFullYear()
    && prevICT.getMonth()    === ictNow.getMonth()
    && prevICT.getDate()     === ictNow.getDate()
    && prevICT.getHours()    === ictHour;
  if (isTargetHour && !alreadyNotifiedThisHour) reasons.push('scheduled');

  if (!reasons.length) {
    res.status(200).json({ skipped: true, ictHour, ictMinute });
    return;
  }

  // ── Build and send notification (web push + LINE พร้อมกัน) ────────────────
  const period = resolvePeriod(ictHour);
  const notification = buildNotification(data, reasons, period);
  const [pushResult, line] = await Promise.all([
    sendToAll(notification),
    sendLineBroadcast(notification),
  ]);
  const { sent, failed } = pushResult;

  // ── Save current state to Supabase ──────────────────────────────────────
  await supabase.from('notification_state').upsert({
    id:           1,
    temp:         data.temp,
    humidity:     data.humidity,
    uv_index:     data.uvIndex,
    pm25:         data.pm25,
    rainfall:     data.rainfall,
    last_warning: warnList[0] ?? null,
    notified_at:  new Date().toISOString(),
  }, { onConflict: 'id' });

  res.status(200).json({ ok: true, sent, failed, line, reasons, ictHour, ictMinute, notification });
}
