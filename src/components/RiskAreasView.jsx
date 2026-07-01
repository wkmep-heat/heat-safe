import { useState, useEffect, useCallback } from 'react';
import { FaExclamationTriangle, FaThermometerHalf, FaTint, FaMapMarkerAlt, FaSync, FaBuilding } from 'react-icons/fa';
import { getHeatColor, getHeatLevel, hotspots as HOTSPOT_DEFS } from '../data/mockData';
import { COMMERCIAL_POINTS, getCommercialColor } from '../data/commercialData';

const REFRESH_MS = 10 * 60 * 1000; // 10 min

function parsePlaceName(data, fallback) {
  if (!data || data.error) return { name: fallback, sub: '' };
  const a = data.address ?? {};
  const name =
    a.amenity || a.building || a.shop || a.office || a.tourism || a.leisure || a.historic ||
    (a.road ? `ถ.${a.road}` : null) || a.suburb ||
    data.display_name?.split(',')[0] || fallback;
  const sub = [
    a.neighbourhood || a.quarter || a.suburb,
    a.city_district || a.town,
  ].filter(Boolean).join(' · ') || a.road || '';
  return { name, sub };
}

function getIntensity(temp, feelsLike) {
  const t = feelsLike ?? temp;
  if (t >= 41 || temp >= 39) return 'extreme';
  return 'high';
}

function fmtTime(d) {
  if (!d) return null;
  return d.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
}

export default function RiskAreasView({ tambons, onLocationClick }) {
  const riskTambons = [...(tambons || [])]
    .sort((a, b) => (b.temperature ?? 0) - (a.temperature ?? 0))
    .slice(0, 8);

  const [geoNames, setGeoNames] = useState({});
  const [geoStatus, setGeoStatus] = useState('loading');

  const [hotspotWx, setHotspotWx] = useState({});
  const [wxStatus, setWxStatus] = useState('loading');
  const [lastUpdated, setLastUpdated] = useState(null);

  /* ── Fetch real-time weather for all hotspot coords (Open-Meteo batch) ── */
  const fetchWx = useCallback(async () => {
    setWxStatus('loading');
    const lats = HOTSPOT_DEFS.map(h => h.lat).join(',');
    const lngs = HOTSPOT_DEFS.map(h => h.lng).join(',');
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lats}&longitude=${lngs}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m` +
        `&timezone=Asia%2FBangkok&wind_speed_unit=kmh`
      );
      const raw = await res.json();
      const arr = Array.isArray(raw) ? raw : [raw];
      const map = {};
      HOTSPOT_DEFS.forEach((h, i) => {
        const wx = arr[i]?.current;
        map[h.id] = wx
          ? { temp: wx.temperature_2m, feels: wx.apparent_temperature, humidity: wx.relative_humidity_2m, wind: wx.wind_speed_10m }
          : null;
      });
      setHotspotWx(map);
      setWxStatus('ok');
      setLastUpdated(new Date());
    } catch {
      setWxStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchWx();
    const id = setInterval(fetchWx, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchWx]);

  /* ── Nominatim reverse-geocode hotspot coords ── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.allSettled(
          HOTSPOT_DEFS.map(h =>
            fetch(
              `https://nominatim.openstreetmap.org/reverse` +
              `?lat=${h.lat}&lon=${h.lng}&format=json&accept-language=th&zoom=17`,
              { headers: { 'User-Agent': 'KKMapHeat/1.0' } }
            ).then(r => r.json())
          )
        );
        if (cancelled) return;
        const map = {};
        results.forEach((res, i) => {
          const h = HOTSPOT_DEFS[i];
          map[h.id] = res.status === 'fulfilled'
            ? parsePlaceName(res.value, h.description)
            : { name: h.description, sub: '' };
        });
        setGeoNames(map);
        setGeoStatus('ok');
      } catch {
        if (!cancelled) setGeoStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      className="absolute right-0 overflow-y-auto overflow-x-hidden"
      style={{ top: 'var(--nav-top)', left: 'var(--nav-x)', bottom: 'var(--nav-bottom)', background: 'linear-gradient(180deg,#fff7ed 0%,#f8faff 100%)' }}
    >
      <div className="max-w-md md:max-w-2xl mx-auto px-4 md:px-8 pt-5 pb-4 space-y-3">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#fed7aa,#fdba74)' }}>
              <FaExclamationTriangle className="text-orange-600" size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">พื้นที่เสี่ยงภัย</h2>
              <p className="text-xs text-slate-400">อ.เมืองขอนแก่น · ข้อมูล Real-time</p>
            </div>
          </div>

          {/* Last updated + manual refresh */}
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-[10px] text-slate-400">อัปเดต {fmtTime(lastUpdated)}</span>
            )}
            <button
              onClick={fetchWx}
              disabled={wxStatus === 'loading'}
              title="รีเฟรชข้อมูล"
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'rgba(251,146,60,0.12)', color: '#f97316', border: '1px solid rgba(251,146,60,0.3)' }}
            >
              <FaSync size={10} className={wxStatus === 'loading' ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Hotspot cards */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">จุดความร้อนสูงสุด</p>
            {geoStatus === 'loading' && (
              <span className="text-[9px] text-blue-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block" />
                กำลังโหลดชื่อสถานที่...
              </span>
            )}
          </div>

          <div className="space-y-2">
            {[...HOTSPOT_DEFS]
              .sort((a, b) => (hotspotWx[b.id]?.temp ?? b.temperature) - (hotspotWx[a.id]?.temp ?? a.temperature))
              .map(h => {
              const wx = hotspotWx[h.id];
              const displayTemp = wx?.temp ?? null;
              const feelsLike   = wx?.feels ?? null;
              const intensity   = displayTemp != null ? getIntensity(displayTemp, feelsLike) : h.intensity;
              const isExtreme   = intensity === 'extreme';
              const dotColor    = isExtreme ? '#ef4444' : '#f97316';
              const place       = geoNames[h.id];

              return (
                <div key={h.id}
                  className="rounded-2xl p-4 bg-white cursor-pointer active:scale-[0.98] transition-transform hover:shadow-md"
                  style={{ border: `1.5px solid ${isExtreme ? '#fca5a5' : '#fed7aa'}` }}
                  onClick={() => onLocationClick?.({
                    lat:         h.lat,
                    lng:         h.lng,
                    name:        place?.name ?? h.description,
                    temperature: displayTemp ?? h.temperature,
                    humidity:    wx?.humidity ?? null,
                    wind:        wx?.wind ?? null,
                  })}>
                  <div className="flex items-start gap-3">

                    {/* Pulsing dot */}
                    <div className="relative flex-shrink-0 mt-1">
                      <div className="w-3 h-3 rounded-full" style={{ background: dotColor }} />
                      <div className="absolute inset-0 rounded-full animate-ping" style={{ background: dotColor, opacity: 0.35 }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {place ? (
                        <>
                          <p className="font-bold text-slate-800 text-sm leading-tight">{place.name}</p>
                          {place.sub && <p className="text-xs text-slate-500 mt-0.5 leading-tight">{place.sub}</p>}
                        </>
                      ) : (
                        <div className="space-y-1">
                          <div className="h-3.5 w-40 rounded-full bg-orange-100 animate-pulse" />
                          <div className="h-2.5 w-28 rounded-full bg-orange-50 animate-pulse" />
                        </div>
                      )}

                      {/* Real-time sub-metrics */}
                      {wx ? (
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                            <FaTint size={8} className="text-blue-300" />{wx.humidity}%
                          </span>
                          <span className="text-[10px] text-slate-500">🌬️ {wx.wind} km/h</span>
                          {feelsLike != null && (
                            <span className="text-[10px]" style={{ color: dotColor }}>รู้สึก {feelsLike.toFixed(1)}°C</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 mt-1.5">
                          <FaMapMarkerAlt size={8} className="text-slate-300 flex-shrink-0" />
                          <p className="text-[9px] text-slate-300 font-mono">{h.lat.toFixed(4)}, {h.lng.toFixed(4)}</p>
                        </div>
                      )}
                    </div>

                    {/* Temp + badge */}
                    <div className="text-right flex-shrink-0">
                      {wxStatus === 'loading' && displayTemp == null ? (
                        <div className="space-y-1">
                          <div className="h-6 w-14 rounded-lg bg-orange-50 animate-pulse" />
                          <div className="h-4 w-10 rounded-full bg-orange-50 animate-pulse ml-auto" />
                        </div>
                      ) : (
                        <>
                          <p className="font-black text-base leading-tight" style={{ color: dotColor }}>
                            {displayTemp != null ? `${displayTemp.toFixed(1)}°C` : `${h.temperature}°C`}
                          </p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: `${dotColor}15`, color: dotColor }}>
                            {isExtreme ? 'วิกฤต' : 'สูง'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Commercial building heat points from KML */}
        <div>
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">
            อาคารพาณิชย์หนาแน่น (เสี่ยงความร้อนสะสม)
          </p>
          <div className="space-y-2">
            {COMMERCIAL_POINTS.map(pt => {
              const color = getCommercialColor(pt.density);
              return (
                <div key={pt.id}
                  className="rounded-2xl px-4 py-3 bg-white flex items-start gap-3 cursor-pointer active:scale-[0.98] transition-transform hover:shadow-md"
                  style={{ border: `1.5px solid ${color}30` }}
                  onClick={() => onLocationClick?.({ lat: pt.lat, lng: pt.lng, name: pt.name })}>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${color}15` }}>
                    <FaBuilding size={11} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 leading-tight">{pt.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight truncate">{pt.type}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5"
                    style={{ background: `${color}15`, color }}>
                    {pt.density}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* High-risk tambons — uses real-time tambons prop from useRealtimeWeather */}
        <div>
          <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2">
            ตำบลเสี่ยงสูง (ความร้อนสะสม)
          </p>
          <div className="space-y-2">
            {riskTambons.map((d, i) => {
              const hColor = getHeatColor(d.heatValue);
              const hLevel = getHeatLevel(d.heatValue);
              return (
                <div key={d.id}
                  className="rounded-2xl px-4 py-3 bg-white flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform hover:shadow-md"
                  style={{ border: '1px solid #ffe4cc' }}
                  onClick={() => onLocationClick?.({
                    lat:         d.lat,
                    lng:         d.lng,
                    name:        `ต.${d.name}`,
                    temperature: d.temperature,
                    humidity:    d.humidity,
                    wind:        d.windSpeed,
                  })}>
                  <span className="text-sm font-black w-5 text-right flex-shrink-0"
                    style={{ color: i < 3 ? '#ef4444' : '#f97316' }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">ต.{d.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <FaThermometerHalf size={8} className="text-orange-300" />
                        {d.temperature != null ? `${d.temperature}°C` : '—'}
                      </span>
                      <span className="text-[10px] text-slate-300">·</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <FaTint size={8} className="text-blue-300" />
                        {d.humidity != null ? `${d.humidity}%` : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black" style={{ color: hColor }}>
                      {Math.round(d.heatValue * 100)}%
                    </p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${hColor}15`, color: hColor }}>
                      {hLevel.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
