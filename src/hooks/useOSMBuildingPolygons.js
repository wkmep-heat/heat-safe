import { useState, useEffect } from 'react';

const DB_NAME  = 'kkmap_idb_v1';
const DB_VER   = 1;
const STORE    = 'kv';
const CACHE_KEY = 'osm_building_polygons_kk_v2';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

// ครอบคลุมขอนแก่น (เหมือน useOSMBuildings)
const BBOX = '16.35,102.75,16.55,102.95';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const QUERY = `[out:json][timeout:120][maxsize:134217728];(way["building"](${BBOX}););out geom qt;`;

/* ── IndexedDB helpers ── */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
    req.onsuccess  = e => resolve(e.target.result);
    req.onerror    = e => reject(e.target.error);
  });
}

async function idbGet(key) {
  try {
    const db = await openDB();
    return new Promise(resolve => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror   = () => resolve(null);
    });
  } catch { return null; }
}

async function idbSet(key, value) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = resolve;
      tx.onerror    = reject;
    });
  } catch { /* ignore write errors */ }
}

/* ── GeoJSON conversion ── */
function elementsToGeoJSON(elements) {
  const features = [];
  for (const el of elements) {
    if (!el.geometry || el.geometry.length < 3) continue;
    const coords = el.geometry.map(p => [p.lon, p.lat]);
    const first = coords[0], last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) coords.push(first);
    features.push({
      type: 'Feature',
      properties: { id: el.id, ...el.tags },
      geometry: { type: 'Polygon', coordinates: [coords] },
    });
  }
  return { type: 'FeatureCollection', features };
}

export function useOSMBuildingPolygons() {
  const [geojson, setGeojson] = useState(null);
  const [count, setCount]     = useState(0);
  const [status, setStatus]   = useState('idle');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // ลอง cache ก่อน (IndexedDB)
      const cached = await idbGet(CACHE_KEY);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        if (!cancelled) {
          setGeojson(cached.data);
          setCount(cached.data.features.length);
          setStatus('ok');
        }
        return;
      }

      if (!cancelled) setStatus('loading');

      try {
        const r = await fetch(OVERPASS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(QUERY)}`,
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        const gj   = elementsToGeoJSON(json.elements ?? []);
        if (!cancelled) {
          setGeojson(gj);
          setCount(gj.features.length);
          setStatus('ok');
        }
        await idbSet(CACHE_KEY, { ts: Date.now(), data: gj });
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { geojson, count, status };
}
