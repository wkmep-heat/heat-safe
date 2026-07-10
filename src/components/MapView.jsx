import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { KK_CENTER, KK_DEFAULT_ZOOM, THAILAND_BOUNDS, hotspots, getTemperatureColor } from '../data/mockData';
import TemperatureLayer from './layers/TemperatureLayer';
import TMDTempTileLayer from './layers/TMDTempTileLayer';
import StreamLayer from './layers/StreamLayer';
import NASATempMonthlyLayer from './layers/NASATempMonthlyLayer';

import HimawariLayer, { HIMAWARI_BANDS, generateFrames } from './layers/HimawariLayer';
import CCTVLayer from './layers/CCTVLayer';
import HeatRiskLayer from './layers/HeatRiskLayer';
import HeatmapLayer from './layers/HeatmapLayer';
import OldBuildingLayer from './layers/OldBuildingLayer';
import ReportPinsLayer from './layers/ReportPinsLayer';
import SuggestedParkLayer from './layers/SuggestedParkLayer';
import 'leaflet/dist/leaflet.css';

const BASEMAPS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    label: 'ดาวเทียม',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
        <line x1="4.93" y1="4.93" x2="9.17" y2="9.17"/><line x1="14.83" y1="14.83" x2="19.07" y2="19.07"/>
        <line x1="14.83" y1="9.17" x2="19.07" y2="4.93"/><line x1="4.93" y1="19.07" x2="9.17" y2="14.83"/>
      </svg>
    ),
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    label: 'แผนที่',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
        <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
      </svg>
    ),
  },
};


/* ── Himawari animated satellite panel ── */
function HimawariPanel({ band, onBandChange, playing, onTogglePlay, frameIdx, frames, onScrub }) {
  const currentTime = frames[frameIdx] ?? '';
  const timeStr = currentTime
    ? new Date(currentTime).toLocaleString('th-TH', {
        hour: '2-digit', minute: '2-digit',
        day: 'numeric', month: 'short',
        timeZone: 'Asia/Bangkok',
      })
    : '--:--';

  return (
    <div
      className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] rounded-xl overflow-hidden"
      style={{
        background: 'rgba(15,23,42,0.93)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(8,145,178,0.4)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
        minWidth: '260px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${playing ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-widest">Himawari-9 AHI</span>
        </div>
        <span className="text-[10px] text-slate-300 font-mono">{timeStr} ICT</span>
      </div>


      {/* Timeline scrubber */}
      <div className="px-3 pt-2">
        <input
          type="range"
          min={0}
          max={frames.length - 1}
          value={frameIdx}
          onChange={e => onScrub(Number(e.target.value))}
          className="w-full h-1 rounded-full cursor-pointer"
          style={{ accentColor: '#0891b2' }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={onTogglePlay}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-150"
          style={{
            background: playing ? 'rgba(8,145,178,0.85)' : 'rgba(255,255,255,0.1)',
            color:      playing ? '#fff' : '#94a3b8',
            border:     `1px solid ${playing ? 'rgba(8,145,178,0.6)' : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          {playing ? (
            <>
              <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor">
                <rect x="0" y="0" width="3.5" height="10" rx="1"/>
                <rect x="5.5" y="0" width="3.5" height="10" rx="1"/>
              </svg>
              หยุด
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <polygon points="0,0 10,5 0,10"/>
              </svg>
              เล่น
            </>
          )}
        </button>

        <div className="flex items-center gap-1.5">
          {/* Frame dots */}
          <div className="flex gap-0.5">
            {frames.map((_, i) => (
              <button
                key={i}
                onClick={() => onScrub(i)}
                className="rounded-full transition-all duration-100"
                style={{
                  width:  i === frameIdx ? '10px' : '4px',
                  height: '4px',
                  background: i <= frameIdx ? '#0891b2' : 'rgba(255,255,255,0.2)',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
          <span className="text-[9px] text-slate-500 font-mono ml-1">
            {frameIdx + 1}/{frames.length}
          </span>
        </div>
      </div>

      {/* Resolution note */}
      <div className="px-3 pb-2 text-[9px] text-slate-600 border-t border-white/[0.05] pt-1.5">
        {HIMAWARI_BANDS.find(b => b.id === band)?.desc} · ทุก 10 นาที · 2 ชั่วโมงย้อนหลัง
      </div>
    </div>
  );
}

function BoundsLocker() {
  const map = useMap();
  useEffect(() => {
    map.setMaxBounds(THAILAND_BOUNDS);
    map.options.maxBoundsViscosity = 0.7;
    map.options.minZoom = 4;
  }, [map]);
  return null;
}

function MapClickHandler({ onMapClick, onPointClick }) {
  const map = useMap();
  useEffect(() => {
    const fn = (e) => {
      onMapClick();
      onPointClick(e.latlng.lat, e.latlng.lng);
    };
    map.on('click', fn);
    return () => map.off('click', fn);
  }, [map, onMapClick, onPointClick]);
  return null;
}

/* ── Temperature popup at arbitrary clicked point ── */
function TempPointMarker({ point, onClose }) {
  const markerRef = useRef(null);

  // Auto-open popup when marker appears on map
  const onAdd = useCallback((e) => { e.target.openPopup(); }, []);

  if (!point) return null;

  const tc   = point.temp != null ? getTemperatureColor(Math.round(point.temp)) : '#3b82f6';
  const icon = L.divIcon({
    className: '',
    html: `<div style="
      width:13px;height:13px;border-radius:50%;
      background:#3b82f6;border:2.5px solid white;
      box-shadow:0 0 0 5px rgba(59,130,246,0.2),0 2px 10px rgba(59,130,246,0.5);
    "></div>`,
    iconSize:   [13, 13],
    iconAnchor: [6.5, 6.5],
  });

  return (
    <Marker
      ref={markerRef}
      position={[point.lat, point.lng]}
      icon={icon}
      eventHandlers={{ add: onAdd }}
    >
      <Popup
        autoPan={false}
        closeButton
        onClose={onClose}
        offset={[0, -10]}
        className="temp-point-popup"
      >
        <div style={{ fontFamily: 'Noto Sans Thai, Inter, sans-serif', minWidth: '160px', padding: '2px 0' }}>
          {point.status === 'loading' && (
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>
              <div style={{ width: '80px', height: '32px', borderRadius: '6px', background: '#f1f5f9', marginBottom: '6px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '48px', height: '12px', borderRadius: '4px', background: '#f1f5f9' }} />
                <div style={{ width: '48px', height: '12px', borderRadius: '4px', background: '#f1f5f9' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>กำลังโหลด...</div>
            </div>
          )}

          {point.status === 'error' && (
            <div style={{ color: '#ef4444', fontSize: '12px' }}>โหลดข้อมูลไม่สำเร็จ</div>
          )}

          {point.status === 'ok' && (
            <>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                🌡️ อุณหภูมิ ณ จุดนี้
              </div>
              <div style={{ fontSize: '30px', fontWeight: 900, color: tc, lineHeight: 1.1 }}>
                {point.temp?.toFixed(1)}
                <span style={{ fontSize: '15px', fontWeight: 700 }}>°C</span>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px', color: '#475569' }}>
                <span>💧 {point.humidity}%</span>
                <span>🌬️ {point.wind} km/h</span>
              </div>
              <div style={{ fontSize: '9px', color: '#cbd5e1', marginTop: '8px', fontFamily: 'monospace' }}>
                {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
              </div>
            </>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

function FlyToHandler({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], target.zoom ?? 14, { animate: true, duration: 1.2 });
  }, [map, target?.ts]);
  return null;
}

function MapPositionTracker({ onMove }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      onMove([c.lat, c.lng], e.target.getZoom());
    },
  });
  return null;
}

function TambonPinMarker({ pin }) {
  const onAdd = useCallback((e) => { e.target.openPopup(); }, []);
  if (!pin) return null;

  const color = getTemperatureColor(pin.temperature ?? 30);
  const icon = L.divIcon({
    className: '',
    html: `<div style="position:relative;width:30px;height:38px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3))">
      <svg width="30" height="38" viewBox="0 0 30 38" fill="none">
        <path d="M15 0C6.716 0 0 6.716 0 15C0 25.5 15 38 15 38C15 38 30 25.5 30 15C30 6.716 23.284 0 15 0Z" fill="${color}"/>
        <circle cx="15" cy="15" r="7" fill="white"/>
      </svg>
    </div>`,
    iconSize:    [30, 38],
    iconAnchor:  [15, 38],
    popupAnchor: [0, -42],
  });

  return (
    <Marker
      key={`${pin.lat}-${pin.lng}`}
      position={[pin.lat, pin.lng]}
      icon={icon}
      eventHandlers={{ add: onAdd }}
    >
      <Popup autoPan={false} closeButton className="temp-point-popup">
        <div style={{ fontFamily: 'Noto Sans Thai, Inter, sans-serif', minWidth: '160px', padding: '2px 0' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
            📍 {pin.name}
          </div>
          {pin.temperature != null && (
            <div style={{ fontSize: '30px', fontWeight: 900, color, lineHeight: 1.1 }}>
              {typeof pin.temperature === 'number' ? Math.round(pin.temperature) : pin.temperature}
              <span style={{ fontSize: '15px', fontWeight: 700 }}>°C</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px', color: '#475569' }}>
            {pin.humidity != null && <span>💧 {pin.humidity}%</span>}
            {pin.wind     != null && <span>🌬️ {pin.wind} km/h</span>}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapView({ activeLayers, tambons, selectedDistrict, onDistrictClick, onMapClick, forecastDatetime, layerSettings, selectedMonth, flyToTarget, initialCenter, initialZoom, onMapMove, mapPin, basemap = 'satellite', onBasemapChange, heatRiskFilter = 'all', reportHeatView = { heatmap: true, pins: true } }) {
  const [tempPoint, setTempPoint] = useState(null);
  const [himawariband, setHimawariband] = useState('ir');
  /* basemap + showMapBox are now controlled by parent */
  const [himawariFrames] = useState(() => generateFrames(12));
  const [himawariFrameIdx, setHimawariFrameIdx] = useState(11); // start at latest
  const [himawariPlaying, setHimawariPlaying] = useState(true);

  // Advance frame every 700ms when playing
  useEffect(() => {
    if (!himawariPlaying) return;
    const id = setInterval(() => {
      setHimawariFrameIdx(i => (i + 1) % himawariFrames.length);
    }, 1500);
    return () => clearInterval(id);
  }, [himawariPlaying, himawariFrames.length]);

  const handlePointClick = useCallback((lat, lng) => {
    setTempPoint({ lat, lng, status: 'loading' });
    fetch(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat.toFixed(6)}&longitude=${lng.toFixed(6)}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m` +
      `&timezone=Asia%2FBangkok&wind_speed_unit=kmh`
    )
      .then(r => r.json())
      .then(d => setTempPoint({
        lat, lng, status: 'ok',
        temp:     d.current?.temperature_2m,
        humidity: d.current?.relative_humidity_2m,
        wind:     d.current?.wind_speed_10m,
      }))
      .catch(() => setTempPoint(p => p ? { ...p, status: 'error' } : null));
  }, []);

  const selectedId = selectedDistrict?.id;
  const s = (id) => layerSettings?.[id] ?? { visible: true, opacity: 0.75 };
  const has = (id) => activeLayers?.has(id) ?? false;

  const tileUrl  = BASEMAPS[basemap]?.url  ?? BASEMAPS.satellite.url;
  const tileAttr = BASEMAPS[basemap]?.attribution ?? BASEMAPS.satellite.attribution;
  const tileKey  = basemap;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={initialCenter ?? KK_CENTER}
        zoom={initialZoom ?? KK_DEFAULT_ZOOM}
        maxBounds={THAILAND_BOUNDS}
        maxBoundsViscosity={0.7}
        minZoom={4}
        maxZoom={17}
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <TileLayer
          key={tileKey}
          url={tileUrl}
          attribution={tileAttr}
          maxZoom={19}
          maxNativeZoom={19}
        />
        {/* Satellite labels overlay — transparent label tiles on top of imagery */}
        {basemap === 'satellite' && (
          <TileLayer
            key={`labels-${tileKey}`}
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            attribution=""
            maxZoom={19}
            maxNativeZoom={19}
            opacity={1}
          />
        )}

        <BoundsLocker />
        <MapClickHandler
          onMapClick={onMapClick}
          onPointClick={handlePointClick}
        />
        <FlyToHandler target={flyToTarget} />
        {onMapMove && <MapPositionTracker onMove={onMapMove} />}
        <TempPointMarker point={tempPoint} onClose={() => setTempPoint(null)} />
        <TambonPinMarker pin={mapPin} />

        {/* Zoom control — bottom right */}
        <div className="leaflet-control-container">
          <div className="leaflet-bottom leaflet-right">
            <div className="leaflet-control-zoom leaflet-bar leaflet-control" />
          </div>
        </div>

        {has('temperature') && s('temperature').visible && forecastDatetime && (
          <TMDTempTileLayer datetime={forecastDatetime} opacity={s('temperature').opacity} />
        )}
        {has('temperature') && s('temperature').visible && (
          <TemperatureLayer districts={tambons} onDistrictClick={onDistrictClick} selectedId={selectedId} opacity={s('temperature').opacity} />
        )}
        {has('stream') && s('stream').visible && (
          <StreamLayer opacity={s('stream').opacity} basemap={basemap} />
        )}
        {has('monthly_temp') && s('monthly_temp').visible && selectedMonth && (
          <NASATempMonthlyLayer month={selectedMonth} opacity={s('monthly_temp').opacity} />
        )}

        {/* Render all frames simultaneously — inactive ones opacity=0 so tiles are cached */}
        {has('himawari') && himawariFrames.map((t, i) => (
          <HimawariLayer
            key={`${himawariband}-${t}`}
            band={himawariband}
            opacity={s('himawari').visible && i === himawariFrameIdx
              ? s('himawari').opacity
              : 0}
            time={t}
          />
        ))}

        {has('cctv') && <CCTVLayer />}
        {has('heatrisk') && <HeatRiskLayer filter={heatRiskFilter} showFlood />}
        {has('heatmap') && <HeatmapLayer opacity={s('heatmap').opacity} />}
        {has('buildings') && s('buildings').visible && (
          <OldBuildingLayer opacity={s('buildings').opacity} />
        )}

        {has('report_heat') && (
          <ReportPinsLayer showHeatmap={reportHeatView.heatmap} showPins={reportHeatView.pins} />
        )}
        {has('suggested_parks') && <SuggestedParkLayer />}
      </MapContainer>

      {/* Floating basemap switcher — bottom-right, above zoom control */}
      {onBasemapChange && (
        <div className="absolute z-[1000] flex flex-col rounded-xl overflow-hidden shadow-lg"
          style={{ bottom: '96px', right: '10px', background: 'rgba(255,255,255,0.97)', border: '1px solid #e0eaff' }}>
          {['street', 'satellite'].map((id, i, arr) => {
            const opt = BASEMAPS[id];
            const active = basemap === id;
            return (
              <button key={id} onClick={() => onBasemapChange(id)} title={opt.label}
                className="w-9 h-9 flex items-center justify-center transition-colors"
                style={{
                  background:    active ? 'rgba(99,102,241,0.1)' : 'transparent',
                  color:         active ? '#4f46e5' : '#64748b',
                  borderBottom:  i < arr.length - 1 ? '1px solid #e0eaff' : 'none',
                }}>
                {opt.icon}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}
