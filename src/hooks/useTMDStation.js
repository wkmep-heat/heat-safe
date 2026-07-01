import { useState, useEffect } from 'react';

/* Bangkok local date parts */
function bkkToday() {
  const s = new Date().toLocaleString('sv', { timeZone: 'Asia/Bangkok' });
  return {
    year:  s.slice(0, 4),
    month: String(parseInt(s.slice(5, 7))),
    day:   String(parseInt(s.slice(8, 10))),
  };
}

function bkkYesterday() {
  const d = new Date(Date.now() - 86400000);
  const s = d.toLocaleString('sv', { timeZone: 'Asia/Bangkok' });
  return {
    year:  s.slice(0, 4),
    month: String(parseInt(s.slice(5, 7))),
    day:   String(parseInt(s.slice(8, 10))),
  };
}

/* POST to TMD — Vite proxy in dev, Vercel serverless in prod */
async function tmdPost(path, params) {
  if (import.meta.env.PROD) {
    const res = await fetch('/api/tmd', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ path, ...params }),
    });
    return res.json();
  } else {
    const res = await fetch(`/tmd-api${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams(params).toString(),
    });
    return res.json();
  }
}

/* Extract a numeric temperature value from various possible response shapes */
function pickValue(res, fieldHints = []) {
  if (!res) return null;
  const d = res.data;
  if (d == null) return null;

  // Array of station rows → find station 61
  const row = Array.isArray(d)
    ? (d.find(r => String(r.id) === '61' || String(r.awsid) === '61' || String(r.station) === '61') ?? d[0])
    : d;

  if (!row) return null;

  for (const k of fieldHints) {
    if (row[k] != null && !isNaN(parseFloat(row[k]))) return parseFloat(row[k]);
  }
  // Last resort: first numeric value in the row
  for (const v of Object.values(row)) {
    if (typeof v === 'number' && !isNaN(v)) return v;
    if (typeof v === 'string' && v !== '' && !isNaN(parseFloat(v))) return parseFloat(v);
  }
  return null;
}

async function fetchClimDay(dateObj) {
  const base = { regions: '4', station: '61', average: 'd',
                  syear: dateObj.year, smonth: dateObj.month, sday: dateObj.day };
  const [maxRes, minRes] = await Promise.all([
    tmdPost('/clim/climPastCityData', { ...base, factor: 'a_tempmax' }),
    tmdPost('/clim/climPastCityData', { ...base, factor: 'a_tempmin' }),
  ]);
  const max = pickValue(maxRes, ['value', 'a_tempmax', 'tempmax', 'tmax', 'v']);
  const min = pickValue(minRes, ['value', 'a_tempmin', 'tempmin', 'tmin', 'v']);
  return { max, min };
}

/* ── Public hook ── */
export function useTMDStation61() {
  const [tempMax, setTempMax] = useState(null);
  const [tempMin, setTempMin] = useState(null);
  const [status,  setStatus]  = useState('loading');

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        // Try today; if data missing fall back to yesterday
        let { max, min } = await fetchClimDay(bkkToday());

        if ((max == null || min == null) && !cancelled) {
          const fallback = await fetchClimDay(bkkYesterday());
          if (max == null) max = fallback.max;
          if (min == null) min = fallback.min;
        }

        if (!cancelled) {
          setTempMax(max);
          setTempMin(min);
          setStatus(max != null && min != null ? 'ok' : 'error');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  return { tempMax, tempMin, status };
}
