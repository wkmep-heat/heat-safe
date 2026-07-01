import { useState, useEffect } from 'react';

const CACHE_KEY = 'osm_buildings_kk_v2';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 วัน
const DATA_URL  = '/data/kk_buildings_old.geojson';

// centroid ของ polygon = ค่าเฉลี่ย coordinate ของ outer ring (4 ตำแหน่ง ~11m)
function polygonCentroid(coordinates) {
  const ring = coordinates[0];
  let lat = 0, lon = 0;
  for (const [lng, lt] of ring) { lon += lng; lat += lt; }
  const n = ring.length;
  return [+(lat / n).toFixed(4), +(lon / n).toFixed(4), 1];
}

export function useOSMBuildings() {
  const [points, setPoints] = useState(null);
  const [count, setCount]   = useState(0);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // ลอง cache localStorage ก่อน
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const { ts, data } = JSON.parse(raw);
          if (Date.now() - ts < CACHE_TTL) {
            if (!cancelled) { setPoints(data); setCount(data.length); setStatus('ok'); }
            return;
          }
        }
      } catch { /* cache เสีย */ }

      if (!cancelled) setStatus('loading');

      try {
        const res = await fetch(DATA_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const gj = await res.json();

        const pts = gj.features
          .filter(f => f.geometry?.type === 'Polygon' && f.geometry.coordinates?.length)
          .map(f => polygonCentroid(f.geometry.coordinates));

        if (!cancelled) { setPoints(pts); setCount(pts.length); setStatus('ok'); }

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: pts }));
        } catch { /* localStorage เต็ม */ }

      } catch (err) {
        console.error('BuildingDensity load error:', err);
        if (!cancelled) setStatus('error');
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { points, count, status };
}
