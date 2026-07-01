import { useState, useEffect } from 'react';

const KK_WMO    = '48381';
const CACHE_KEY = 'tmd_kk_last';

/* Cache with 3-hour TTL (matches TMD update interval) */
function saveCache(d) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ d, t: Date.now() })); } catch {}
}
function loadCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
    if (!raw || Date.now() - raw.t > 3 * 60 * 60 * 1000) return null;
    return raw.d;
  } catch { return null; }
}

function parseNum(v) {
  const n = parseFloat(v);
  return isNaN(n) ? null : Math.round(n * 10) / 10;
}

function extractKhonKaen(xmlText) {
  const doc      = new DOMParser().parseFromString(xmlText, 'text/xml');
  const stations = doc.querySelectorAll('Station');

  for (const s of stations) {
    if (s.querySelector('WmoStationNumber')?.textContent?.trim() !== KK_WMO) continue;
    const obs = s.querySelector('Observation');
    if (!obs) break;

    return {
      temperature: (() => { const v = parseNum(obs.querySelector('Temperature')?.textContent); return v != null ? Math.round(v) : null; })(),
      tempMax:     (() => { const v = parseNum(obs.querySelector('MaxTemperature')?.textContent); return v != null ? Math.round(v) : null; })(),
      tempMin:     (() => { const v = parseNum(obs.querySelector('MinTemperature')?.textContent); return v != null ? Math.round(v) : null; })(),
      humidity:    parseNum(obs.querySelector('RelativeHumidity')?.textContent),
      windSpeed:   parseNum(obs.querySelector('WindSpeed')?.textContent),
      windDir:     parseNum(obs.querySelector('WindDirection')?.textContent),
      pressure:    parseNum(obs.querySelector('MeanSeaLevelPressure')?.textContent),
      rainfall:    parseNum(obs.querySelector('Rainfall')?.textContent),
      observedAt:  obs.querySelector('DateTime')?.textContent?.trim() ?? null,
    };
  }
  return null;
}

export function useTMDWeather() {
  const [data,   setData]   = useState(() => loadCache());
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const url = import.meta.env.PROD ? '/api/tmd-legacy' : '/tmd-weather';
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const kk = extractKhonKaen(await res.text());

        if (!cancelled) {
          if (kk) saveCache(kk);
          setData(kk ?? loadCache());
          setStatus(kk ? 'ok' : 'error');
        }
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    run();
    const id = setInterval(run, 30 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return { data, status };
}
