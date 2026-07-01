import { useState, useEffect } from 'react';

const CACHE_KEY = 'old_buildings_kk_v1';
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
const DATA_URL  = '/data/kk_buildings_old.geojson';

const DB_NAME = 'kkmap_idb_v1';
const DB_VER  = 1;
const STORE   = 'kv';

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
    return new Promise(r => {
      const req = db.transaction(STORE,'readonly').objectStore(STORE).get(key);
      req.onsuccess = () => r(req.result ?? null);
      req.onerror   = () => r(null);
    });
  } catch { return null; }
}
async function idbSet(key, val) {
  try {
    const db = await openDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(val, key);
      tx.oncomplete = res; tx.onerror = rej;
    });
  } catch {}
}

export function useOldBuildings() {
  const [geojson, setGeojson]   = useState(null);
  const [count, setCount]       = useState(0);
  const [status, setStatus]     = useState('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const cached = await idbGet(CACHE_KEY);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        if (!cancelled) { setGeojson(cached.data); setCount(cached.data.features.length); setStatus('ok'); }
        return;
      }
      if (!cancelled) { setStatus('loading'); setProgress(0); }
      try {
        const res = await fetch(DATA_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const total = parseInt(res.headers.get('content-length') || '0', 10);
        let loaded = 0;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          loaded += value.byteLength;
          text   += decoder.decode(value, { stream: true });
          if (total > 0 && !cancelled) setProgress(loaded / total);
        }
        const gj = JSON.parse(text);
        if (!cancelled) { setGeojson(gj); setCount(gj.features.length); setStatus('ok'); setProgress(1); }
        await idbSet(CACHE_KEY, { ts: Date.now(), data: gj });
      } catch (err) {
        console.error('OldBuildings error:', err);
        if (!cancelled) setStatus('error');
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { geojson, count, status, progress };
}
