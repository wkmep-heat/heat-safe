import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const VAPID_PUBLIC  = 'BPK1ArKe9auD9PmUHEyqKDJv-Y_tucS3I73HCpGIIZSskw2_FnvxKqYxk2I4V9nVROtEtQbLDBdr63cAkMx1UnY';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL   = process.env.VAPID_EMAIL ?? 'mailto:admin@kkmap.app';
const KK_LAT  = 16.4322;
const KK_LNG  = 102.8359;
const KK_WMO  = '48381';

// Scheduled notification times (ICT)
const SCHEDULED_TIMES = [
  { h:  7, m:  0 },
  { h: 11, m: 30 },
  { h: 15, m:  0 },
];

// UV levels: 3=ปานกลาง, 6=สูง, 8=สูงมาก, 11=อันตราย
const UV_LEVELS = [
  { min: 11, label: 'อันตราย' },
  { min:  8, label: 'สูงมาก' },
  { min:  6, label: 'สูง' },
  { min:  3, label: 'ปานกลาง' },
];

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

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
function buildNotification(data, reasons) {
  const { temp, uvIndex, rainfall, precipProb } = data;

  // ICT time string e.g. "06.30"
  const ictNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  const hh = String(ictNow.getHours()).padStart(2, '0');
  const mm = String(ictNow.getMinutes()).padStart(2, '0');
  const timeStr = `${hh}.${mm}`;

  // Severe weather warning — keep original warning text
  if (reasons.includes('warning')) {
    return {
      title: '🌪️ เตือนภัยอากาศ TMD · ขอนแก่น',
      body:  data.warnings?.[0] ?? 'มีประกาศเตือนภัยสภาพอากาศในพื้นที่ขอนแก่น',
    };
  }

  const tempStr = temp != null ? `${Math.round(temp)}°C` : '--';
  const uvStr   = uvIndex != null ? Math.round(uvIndex) : '--';
  const uvLevel = uvIndex != null ? (UV_LEVELS.find(l => uvIndex >= l.min)?.label ?? 'ต่ำ') : 'ต่ำ';

  // Rain suffix
  let rainSuffix = '';
  if (rainfall != null && rainfall > 5) {
    rainSuffix = ` และมีฝนตก ${rainfall} มม. โปรดระวัง`;
  } else if (precipProb != null && precipProb >= 70) {
    rainSuffix = ` และมีโอกาสฝนตก ${precipProb}% โปรดระวัง`;
  } else if (precipProb != null && precipProb >= 40) {
    rainSuffix = ' และอาจมีฝนตกเล็กน้อย โปรดระวัง';
  }

  const body = `เวลา ${timeStr} น. อุณหภูมิ ${tempStr} UV ${uvStr} (${uvLevel})${rainSuffix}`;

  // UV alert — different title
  if (reasons.includes('uv_alert')) {
    return {
      title: `☀️ UV สูงขึ้นระดับปานกลาง · ขอนแก่น`,
      body,
    };
  }

  // Emoji for scheduled
  const hasRain = (rainfall ?? 0) > 0 || (precipProb ?? 0) >= 40;
  const emoji = hasRain ? ((precipProb ?? 0) >= 70 || (rainfall ?? 0) > 5 ? '🌧️' : '🌦️')
              : (uvIndex ?? 0) >= 8 ? '☀️' : (temp ?? 0) >= 35 ? '🌡️' : '🌤️';

  return {
    title: `${emoji} สภาพอากาศขอนแก่น`,
    body,
  };
}

// ── Send push to all subscribers ────────────────────────────────────────────
async function sendToAll(notification) {
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

// ── Main handler ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Verify Vercel cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers['authorization'] !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!VAPID_PRIVATE) {
    res.status(503).json({ error: 'VAPID_PRIVATE_KEY not set' });
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

  // 3. Scheduled time
  const isScheduled = SCHEDULED_TIMES.some(t => t.h === ictHour && t.m === ictMinute);
  if (isScheduled) reasons.push('scheduled');

  if (!reasons.length) {
    res.status(200).json({ skipped: true, ictHour, ictMinute });
    return;
  }

  // ── Build and send notification ──────────────────────────────────────────
  const notification = buildNotification(data, reasons);
  const { sent, failed } = await sendToAll(notification);

  // ── Save current state to Supabase ──────────────────────────────────────
  await supabase.from('notification_state').upsert({
    id:           1,
    temp:         temp,
    humidity:     humidity,
    uv_index:     uvIndex,
    pm25:         pm25,
    rainfall:     rainfall,
    last_warning: warnList[0] ?? null,
    notified_at:  new Date().toISOString(),
  }, { onConflict: 'id' });

  res.status(200).json({ ok: true, sent, failed, reasons, ictHour, ictMinute, notification });
}
