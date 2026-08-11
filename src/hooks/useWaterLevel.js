import { useState, useEffect, useCallback, useRef } from 'react';

const REFRESH_MS = 5 * 60_000; // ระดับน้ำอัปเดตราวรายชั่วโมง — โพลทุก 5 นาทีพอ

export function useWaterLevel() {
  const [stations,    setStations]    = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [status,      setStatus]      = useState('loading'); // loading | refreshing | ok | error
  const [lastUpdated, setLastUpdated] = useState(null);
  const first = useRef(true);

  const load = useCallback(async () => {
    setStatus(first.current ? 'loading' : 'refreshing');
    try {
      const res  = await fetch('/api/waterlevel');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error ?? 'load failed');
      setStations(json.stations ?? []);
      setSummary(json.summary ?? null);
      setLastUpdated(new Date());
      setStatus('ok');
    } catch {
      setStatus('error');
    } finally {
      first.current = false;
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  return { stations, summary, status, lastUpdated, refresh: load };
}
