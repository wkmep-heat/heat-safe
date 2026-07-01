import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const KK_CENTER_LNG = 102.8359;
const KK_CENTER_LAT = 16.4322;

const DEM_MODES = [
  { id: 'none',      label: 'ปิด' },
  { id: 'hillshade', label: 'Hillshade' },
  { id: 'colordem',  label: 'Elevation Color' },
];

export default function Map3DView({ onClose }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [pitch, setPitch] = useState(55);
  const [exaggeration, setExaggeration] = useState(2);
  const [bearing, setBearing] = useState(-20);
  const [demMode, setDemMode] = useState('none');
  const [hillshadeIntensity, setHillshadeIntensity] = useState(0.5);
  const [demOpacity, setDemOpacity] = useState(0.6);
  const [satOpacity, setSatOpacity] = useState(1);
  const [showStream, setShowStream] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          satellite: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: '© Esri — World Imagery',
          },
          terrain: {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            tileSize: 256,
            encoding: 'terrarium',
          },
          shadedrelief: {
            type: 'raster',
            tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}'],
            tileSize: 256,
            attribution: '© Esri — World Shaded Relief',
            maxzoom: 13,
          },
        },
        layers: [
          { id: 'satellite', type: 'raster', source: 'satellite', paint: { 'raster-opacity': 1 } },
          {
            id: 'hillshade', type: 'hillshade', source: 'terrain',
            layout: { visibility: 'none' },
            paint: {
              'hillshade-exaggeration': 0.5,
              'hillshade-shadow-color': '#1a202c',
              'hillshade-highlight-color': '#ffffff',
              'hillshade-accent-color': '#4a5568',
              'hillshade-illumination-direction': 335,
              'hillshade-illumination-anchor': 'map',
            },
          },
          {
            id: 'colordem', type: 'raster', source: 'shadedrelief',
            layout: { visibility: 'none' },
            paint: { 'raster-opacity': 0.6 },
          },
        ],
        terrain: { source: 'terrain', exaggeration: 2 },
        sky: {
          'sky-color': '#87CEEB', 'sky-horizon-blend': 0.5,
          'horizon-color': '#c8e8ff', 'horizon-fog-blend': 0.3,
          'fog-color': '#d8eeff', 'fog-ground-blend': 0.5,
        },
      },
      center: [KK_CENTER_LNG, KK_CENTER_LAT],
      zoom: 9, pitch: 55, bearing: -20, maxPitch: 85,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    map.on('load', () => {
      map.setTerrain({ source: 'terrain', exaggeration: 2 });

      fetch('/geo.geojson')
        .then(r => r.json())
        .then(data => {
          if (!mapRef.current) return;
          map.addSource('stream-source', { type: 'geojson', data });
          map.addLayer({
            id: 'stream',
            type: 'line',
            source: 'stream-source',
            layout: { visibility: 'none', 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#38bdf8', 'line-width': 2, 'line-opacity': 0.85 },
          });
        })
        .catch(err => console.error('stream 3D fetch error:', err));
    });

    map.on('pitchend', () => setPitch(Math.round(map.getPitch())));
    map.on('rotateend', () => setBearing(Math.round(map.getBearing())));

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  const applyExaggeration = (v) => { setExaggeration(v); mapRef.current?.setTerrain({ source: 'terrain', exaggeration: v }); };
  const applyPitch        = (v) => { setPitch(v);        mapRef.current?.setPitch(v); };
  const applySatOpacity   = (v) => { setSatOpacity(v);   mapRef.current?.setPaintProperty('satellite', 'raster-opacity', v); };

  const applyDemMode = (mode) => {
    const map = mapRef.current; if (!map) return;
    setDemMode(mode);
    map.setLayoutProperty('hillshade', 'visibility', 'none');
    map.setLayoutProperty('colordem',  'visibility', 'none');
    if (mode === 'hillshade') { map.setLayoutProperty('hillshade', 'visibility', 'visible'); map.setPaintProperty('hillshade', 'hillshade-exaggeration', hillshadeIntensity); }
    if (mode === 'colordem')  { map.setLayoutProperty('colordem',  'visibility', 'visible'); map.setPaintProperty('colordem',  'raster-opacity', demOpacity); }
  };
  const applyHillshadeInt = (v) => { setHillshadeIntensity(v); if (demMode === 'hillshade') mapRef.current?.setPaintProperty('hillshade', 'hillshade-exaggeration', v); };
  const applyDemOpacity   = (v) => { setDemOpacity(v);         if (demMode === 'colordem')  mapRef.current?.setPaintProperty('colordem',  'raster-opacity', v); };

  const toggleStream = () => {
    const map = mapRef.current; if (!map) return;
    const next = !showStream;
    setShowStream(next);
    if (map.getLayer('stream')) {
      map.setLayoutProperty('stream', 'visibility', next ? 'visible' : 'none');
    }
  };

  const resetView = () => {
    mapRef.current?.flyTo({ center: [KK_CENTER_LNG, KK_CENTER_LAT], zoom: 9, pitch: 55, bearing: -20, duration: 1500 });
    setPitch(55); setBearing(-20);
  };

  const modeColor = { none: '#94a3b8', hillshade: '#f59e0b', colordem: '#10b981' };

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
        style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
        3D Terrain · DEM
      </div>

      {/* ── Floating re-open pill (mobile only, when panel is hidden) ── */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className="absolute z-10 md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all active:scale-95"
          style={{
            top: '72px', right: '8px',
            background: 'rgba(15,23,42,0.88)',
            backdropFilter: 'blur(12px)',
            color: '#a5b4fc',
            border: '1px solid rgba(99,102,241,0.4)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
            <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
            <line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
          </svg>
          ตั้งค่า
        </button>
      )}

      {/* ── Control panel (always visible on desktop, togglable on mobile) ── */}
      <div
        className={`absolute right-14 z-10 rounded-xl transition-all duration-200 ${panelOpen ? 'flex flex-col gap-3' : 'hidden md:flex md:flex-col md:gap-3'}`}
        style={{
          top: '72px', width: '190px', padding: '12px',
          background: 'rgba(15,23,42,0.9)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
        }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between -mb-1">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Terrain</p>
          {/* Collapse button — mobile only */}
          <button
            onClick={() => setPanelOpen(false)}
            className="md:hidden w-5 h-5 rounded-md flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
            title="ซ่อนเมนู"
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <Slider label="มุมก้ม"   value={pitch}        unit="°" color="#6366f1" textColor="text-indigo-400"  min={0}   max={85}  step={1}    onChange={applyPitch} />
        <Slider label="ความสูง"  value={exaggeration} unit="x" color="#10b981" textColor="text-emerald-400" min={1}   max={5}   step={0.5}  onChange={applyExaggeration} />
        <Slider label="ดาวเทียม" value={satOpacity}   unit="%" display={Math.round(satOpacity * 100)} color="#0ea5e9" textColor="text-sky-400" min={0} max={1} step={0.05} onChange={applySatOpacity} />

        <div className="pt-1 border-t border-white/10">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">DEM Layer</p>
          <div className="flex gap-1 mb-2">
            {DEM_MODES.map(({ id, label }) => (
              <button key={id} onClick={() => applyDemMode(id)}
                className="flex-1 py-1 rounded-md text-[9px] font-bold transition-all"
                style={{ background: demMode === id ? `${modeColor[id]}22` : 'rgba(255,255,255,0.05)', color: demMode === id ? modeColor[id] : '#475569', border: `1px solid ${demMode === id ? `${modeColor[id]}60` : 'rgba(255,255,255,0.08)'}` }}>
                {label}
              </button>
            ))}
          </div>
          {demMode === 'hillshade' && <>
            <Slider label="ความเข้ม" value={hillshadeIntensity} unit="%" display={Math.round(hillshadeIntensity * 100)} color="#f59e0b" textColor="text-amber-400" min={0} max={1} step={0.05} onChange={applyHillshadeInt} />
            <p className="text-[9px] text-slate-500 mt-1">เงาแสงจาก DEM</p>
          </>}
          {demMode === 'colordem' && <>
            <Slider label="ความทึบ" value={demOpacity} unit="%" display={Math.round(demOpacity * 100)} color="#10b981" textColor="text-emerald-400" min={0} max={1} step={0.05} onChange={applyDemOpacity} />
            <p className="text-[9px] text-slate-500 mt-1">Esri Shaded Relief</p>
          </>}
          {demMode === 'none' && <p className="text-[9px] text-slate-600">เลือก Hillshade หรือ Elevation Color</p>}
        </div>

        {/* Stream layer toggle */}
        <div className="pt-1 border-t border-white/10">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Layers</p>
          <button
            onClick={toggleStream}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-all"
            style={{
              background: showStream ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${showStream ? 'rgba(56,189,248,0.5)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <div className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={showStream ? '#38bdf8' : '#475569'} strokeWidth="2.5" strokeLinecap="round">
                <path d="M3 12 C6 8, 9 16, 12 12 S18 8, 21 12"/>
              </svg>
              <span className="text-[10px] font-semibold" style={{ color: showStream ? '#38bdf8' : '#475569' }}>ร่องน้ำ</span>
            </div>
            <div className="w-7 h-3.5 rounded-full relative transition-all" style={{ background: showStream ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.1)' }}>
              <div className="absolute top-0.5 w-2.5 h-2.5 rounded-full transition-all" style={{ background: showStream ? '#38bdf8' : '#475569', left: showStream ? '15px' : '2px' }} />
            </div>
          </button>
        </div>

        <div className="flex flex-col gap-1 pt-1 border-t border-white/10">
          <div className="flex justify-between">
            <span className="text-[10px] text-slate-500">หมุน</span>
            <span className="text-[10px] text-slate-300">{bearing}°</span>
          </div>
          <p className="text-[9px] text-slate-600">คลิกขวาลาก หรือ Ctrl+drag</p>
        </div>

        <button onClick={resetView}
          className="w-full py-1.5 rounded-lg text-[10px] font-semibold transition-all"
          style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
          รีเซ็ตมุมมอง
        </button>
      </div>

      <button onClick={onClose}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
        style={{ background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(12px)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
        กลับสู่โหมด 2D
      </button>
    </div>
  );
}

function Slider({ label, value, unit, display, color, textColor, min, max, step, onChange }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] font-semibold text-slate-400">{label}</span>
        <span className={`text-[10px] font-bold ${textColor}`}>{display ?? value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }} />
    </div>
  );
}
