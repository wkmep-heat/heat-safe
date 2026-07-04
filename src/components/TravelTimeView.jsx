import { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, GeoJSON, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { KK_CENTER, KK_DEFAULT_ZOOM, KK_BOUNDS } from '../data/mockData';
import { CAFES } from '../data/cafeData';
import { HOSPITALS } from '../data/hospitalData';
import { MALLS } from '../data/mallData';
import { PARKS } from '../data/parkData';
import { SUGGESTED_PARKS } from '../data/suggestedParkData';

const BASEMAPS = {
  light:     { label: 'สว่าง',    icon: '☀️', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr: '© OpenStreetMap © CARTO' },
  satellite: { label: 'ดาวเทียม', icon: '🛰️', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles © Esri' },
  street:    { label: 'แผนที่',   icon: '🗺️', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© OpenStreetMap contributors' },
};

const MODES = [
  { id: 'driving-car',     label: 'รถยนต์',       icon: '🚗' },
  { id: 'motorcycle',      label: 'มอเตอร์ไซค์',  icon: '🏍️' },
  { id: 'foot-walking',    label: 'เดินเท้า',     icon: '🚶' },
  { id: 'cycling-regular', label: 'จักรยาน',      icon: '🚲' },
];

const TIME_OPTIONS = [15, 30, 45, 60];

const RING_STYLE = {
  15: { color: '#16a34a', fillColor: '#22c55e', fillOpacity: 0.25, weight: 2 },
  30: { color: '#ca8a04', fillColor: '#eab308', fillOpacity: 0.22, weight: 2 },
  45: { color: '#ea580c', fillColor: '#f97316', fillOpacity: 0.20, weight: 2 },
  60: { color: '#dc2626', fillColor: '#ef4444', fillOpacity: 0.18, weight: 2 },
};

const originIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#3b82f6;border:3px solid #fff;
    box-shadow:0 2px 8px rgba(59,130,246,0.6)">
  </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const userLocationIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:24px;height:24px">
    <div style="
      position:absolute;inset:0;border-radius:50%;
      background:rgba(59,130,246,0.25);
      animation:pulse-ring 1.8s ease-out infinite">
    </div>
    <div style="
      position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      width:14px;height:14px;border-radius:50%;
      background:#2563eb;border:3px solid #fff;
      box-shadow:0 2px 8px rgba(37,99,235,0.7)">
    </div>
  </div>
  <style>
    @keyframes pulse-ring {
      0%   { transform:scale(0.5); opacity:1; }
      100% { transform:scale(2.2); opacity:0; }
    }
  </style>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function FlyTo({ latlng }) {
  const map = useMap();
  useEffect(() => {
    if (latlng) map.flyTo([latlng.lat, latlng.lng], 14, { duration: 1.2 });
  }, [map, latlng]);
  return null;
}

const schoolIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50%;
    background:#fff;border:2px solid #3b82f6;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,0.15);
    font-size:16px;cursor:pointer;">🏫</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const cafeIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50%;
    background:#fff;border:2px solid #f97316;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,0.15);
    font-size:16px;cursor:pointer;">☕</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function CafeLayer({ onCafeClick }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    const lyr = L.markerClusterGroup({ maxClusterRadius: 40, disableClusteringAtZoom: 16 });
    CAFES.forEach(cafe => {
      const marker = L.marker([cafe.lat, cafe.lng], { icon: cafeIcon });
      marker.bindTooltip(cafe.name, { direction: 'top', offset: [0, -14] });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onCafeClick({ lat: cafe.lat, lng: cafe.lng }, cafe.name);
      });
      lyr.addLayer(marker);
    });
    lyr.addTo(map);
    layerRef.current = lyr;
    return () => { map.removeLayer(lyr); layerRef.current = null; };
  }, [map, onCafeClick]);

  return null;
}

function MapClickHandler({ onClick }) {
  useMapEvents({ click: e => onClick(e.latlng) });
  return null;
}

const hospitalIconMarker = L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50%;
    background:#fff;border:2px solid #ef4444;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,0.15);
    font-size:16px;cursor:pointer;">🏥</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function HospitalLayer({ onHospitalClick }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    const lyr = L.markerClusterGroup({ maxClusterRadius: 40, disableClusteringAtZoom: 16 });
    HOSPITALS.forEach(h => {
      const marker = L.marker([h.lat, h.lng], { icon: hospitalIconMarker });
      marker.bindTooltip(h.name, { direction: 'top', offset: [0, -14] });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onHospitalClick({ lat: h.lat, lng: h.lng }, h.name);
      });
      lyr.addLayer(marker);
    });
    lyr.addTo(map);
    layerRef.current = lyr;
    return () => { map.removeLayer(lyr); layerRef.current = null; };
  }, [map, onHospitalClick]);

  return null;
}

const mallIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50%;
    background:#fff;border:2px solid #8b5cf6;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,0.15);
    font-size:16px;cursor:pointer;">🛍️</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MallLayer({ onMallClick }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    const lyr = L.markerClusterGroup({ maxClusterRadius: 40, disableClusteringAtZoom: 16 });
    MALLS.forEach(m => {
      const marker = L.marker([m.lat, m.lng], { icon: mallIcon });
      marker.bindTooltip(m.name, { direction: 'top', offset: [0, -14] });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onMallClick({ lat: m.lat, lng: m.lng }, m.name);
      });
      lyr.addLayer(marker);
    });
    lyr.addTo(map);
    layerRef.current = lyr;
    return () => { map.removeLayer(lyr); layerRef.current = null; };
  }, [map, onMallClick]);

  return null;
}

const parkIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50%;
    background:#fff;border:2px solid #22c55e;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,0.15);
    font-size:16px;cursor:pointer;">🌳</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function ParkLayer({ onParkClick }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    const lyr = L.markerClusterGroup({ maxClusterRadius: 40, disableClusteringAtZoom: 16 });
    PARKS.forEach(p => {
      const marker = L.marker([p.lat, p.lng], { icon: parkIcon });
      marker.bindTooltip(p.name, { direction: 'top', offset: [0, -14] });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onParkClick({ lat: p.lat, lng: p.lng }, p.name);
      });
      lyr.addLayer(marker);
    });
    lyr.addTo(map);
    layerRef.current = lyr;
    return () => { map.removeLayer(lyr); layerRef.current = null; };
  }, [map, onParkClick]);

  return null;
}

const SCHOOL_NAME_OVERRIDES = {
  'โรงเรียนหนองแวงวิทยา': 'โรงเรียนเทศบาลวัดกลาง',
};

function kmlDocToGeoJson(doc) {
  const features = [];
  const parseCoords = t => (t || '').trim().split(/\s+/).map(c => {
    const p = c.split(',');
    return [parseFloat(p[0]), parseFloat(p[1])];
  }).filter(([x, y]) => !isNaN(x) && !isNaN(y));

  for (const pm of doc.getElementsByTagName('Placemark')) {
    const name = pm.querySelector('name')?.textContent || '';
    const ptc = pm.querySelector('Point coordinates');
    if (ptc) {
      const p = ptc.textContent.trim().split(',');
      features.push({ type: 'Feature', properties: { name }, geometry: { type: 'Point', coordinates: [+p[0], +p[1]] } });
    }
  }
  return { type: 'FeatureCollection', features };
}

function SchoolLayer({ onSchoolClick }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/kmz/school.kmz');
        if (!res.ok || cancelled) return;
        const buf = await res.arrayBuffer();

        let kmlText = null;
        if (window.JSZip) {
          const zip = await window.JSZip.loadAsync(buf);
          for (const [fn, file] of Object.entries(zip.files)) {
            if (fn.toLowerCase().endsWith('.kml')) { kmlText = await file.async('text'); break; }
          }
        }
        if (!kmlText || cancelled) return;

        const doc = new DOMParser().parseFromString(kmlText, 'text/xml');
        const gj = window.toGeoJSON ? window.toGeoJSON.kml(doc) : kmlDocToGeoJson(doc);
        if (cancelled) return;

        const cluster = L.markerClusterGroup({ maxClusterRadius: 40, disableClusteringAtZoom: 16 });
        const geoLayer = L.geoJSON(gj, {
          filter: f => {
            if (f.geometry?.type !== 'Point') return false;
            const [lng, lat] = f.geometry.coordinates;
            return lat >= KK_BOUNDS[0][0] && lat <= KK_BOUNDS[1][0]
                && lng >= KK_BOUNDS[0][1] && lng <= KK_BOUNDS[1][1];
          },
          pointToLayer: (feature, ll) => {
            const rawName = feature.properties?.name || 'โรงเรียน';
            const name = SCHOOL_NAME_OVERRIDES[rawName] ?? rawName;
            const marker = L.marker(ll, { icon: schoolIcon });
            marker.bindTooltip(name, { direction: 'top', offset: [0, -14] });
            marker.on('click', (e) => {
              L.DomEvent.stopPropagation(e);
              onSchoolClick({ lat: ll.lat, lng: ll.lng }, name);
            });
            return marker;
          },
        });
        cluster.addLayer(geoLayer);
        cluster.addTo(map);
        layerRef.current = cluster;
      } catch (e) {
        console.warn('School KMZ load error:', e);
      }
    }

    load();
    return () => {
      cancelled = true;
      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
    };
  }, [map, onSchoolClick]);

  return null;
}

const suggestedParkIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;border-radius:50%;
    background:#fff;border:2.5px dashed #16a34a;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,0.15);
    font-size:15px;cursor:pointer;">🌿</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function SuggestedParkLayer({ onParkClick }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    const lyr = L.markerClusterGroup({ maxClusterRadius: 40, disableClusteringAtZoom: 16 });
    SUGGESTED_PARKS.forEach(p => {
      const marker = L.marker([p.lat, p.lng], { icon: suggestedParkIcon });
      marker.bindTooltip(`แนะนำสวนสาธารณะ #${p.id}`, { direction: 'top', offset: [0, -14] });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onParkClick({ lat: p.lat, lng: p.lng }, `แนะนำสวนสาธารณะ #${p.id}`);
      });
      lyr.addLayer(marker);
    });
    lyr.addTo(map);
    layerRef.current = lyr;
    return () => { map.removeLayer(lyr); layerRef.current = null; };
  }, [map, onParkClick]);

  return null;
}

/* ค่าประมาณความเร็วเฉลี่ยในเมือง (กม./ชม.) ใช้คำนวณรัศมีวงกลมแทนการเรียก routing API ภายนอก */
const AVG_SPEED_KMH = {
  'driving-car':     30,
  'motorcycle':      35,
  'foot-walking':    4.5,
  'cycling-regular': 12,
};

function circlePolygon(lat, lng, radiusMeters, sides = 64) {
  const EARTH_RADIUS = 6371000;
  const latRad = lat * Math.PI / 180;
  const coords = [];
  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * 2 * Math.PI;
    const dx = radiusMeters * Math.cos(angle);
    const dy = radiusMeters * Math.sin(angle);
    const dLat = (dy / EARTH_RADIUS) * (180 / Math.PI);
    const dLng = (dx / (EARTH_RADIUS * Math.cos(latRad))) * (180 / Math.PI);
    coords.push([lng + dLng, lat + dLat]);
  }
  return coords;
}

function buildCircleIsochrones(lat, lng, profile, minutesList) {
  const speedMps = ((AVG_SPEED_KMH[profile] ?? 30) * 1000) / 3600;
  return {
    type: 'FeatureCollection',
    features: minutesList.map(m => ({
      type: 'Feature',
      properties: { value: m * 60 },
      geometry: { type: 'Polygon', coordinates: [circlePolygon(lat, lng, speedMps * m * 60)] },
    })),
  };
}

export default function TravelTimeView() {
  const [origin, setOrigin]         = useState(null);
  const [originName, setOriginName] = useState(null);
  const [mode, setMode]             = useState('driving-car');
  const [times, setTimes]           = useState([15, 30]);
  const [geojson, setGeojson]       = useState(null);
  const [error, setError]           = useState(null);
  const [userLocation, setUserLocation]   = useState(null);
  const [locating, setLocating]           = useState(false);
  const [flyTarget, setFlyTarget]         = useState(null);
  const [showSchools, setShowSchools] = useState(false);
  const [showCafes, setShowCafes]         = useState(false);
  const [showHospitals, setShowHospitals] = useState(false);
  const [showMalls, setShowMalls]         = useState(false);
  const [showParks, setShowParks]             = useState(false);
  const [showSuggestedParks, setShowSuggestedParks] = useState(false);
  const [basemap, setBasemap]             = useState('street');
  const geojsonKey = useRef(0);

  const toggleTime = useCallback((t) => {
    setTimes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t].sort((a, b) => a - b)
    );
  }, []);

  const runIsochrone = useCallback((latlng, name = null) => {
    if (times.length === 0) { setError('เลือกช่วงเวลาอย่างน้อย 1 รายการ'); return; }

    setOrigin(latlng);
    setOriginName(name);
    setError(null);
    geojsonKey.current += 1;
    setGeojson(buildCircleIsochrones(latlng.lat, latlng.lng, mode, times));
  }, [mode, times]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) { setError('เบราว์เซอร์ไม่รองรับ Geolocation'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(latlng);
        setFlyTarget({ ...latlng, ts: Date.now() });
        setLocating(false);
      },
      (err) => {
        setError('ไม่สามารถเข้าถึงตำแหน่งได้: ' + err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleMapClick    = useCallback((latlng) => runIsochrone(latlng, null), [runIsochrone]);
  const handleSchoolClick = useCallback((latlng, name) => runIsochrone(latlng, name), [runIsochrone]);
  const handleCafeClick     = useCallback((latlng, name) => runIsochrone(latlng, name), [runIsochrone]);
  const handleHospitalClick = useCallback((latlng, name) => runIsochrone(latlng, name), [runIsochrone]);
  const handleMallClick     = useCallback((latlng, name) => runIsochrone(latlng, name), [runIsochrone]);
  const handleParkClick          = useCallback((latlng, name) => runIsochrone(latlng, name), [runIsochrone]);
  const handleSuggestedParkClick = useCallback((latlng, name) => runIsochrone(latlng, name), [runIsochrone]);

  const styleFeature = useCallback((feature) => {
    const seconds = feature.properties?.value ?? 0;
    const minutes = Math.round(seconds / 60);
    const closest = TIME_OPTIONS.reduce((a, b) =>
      Math.abs(b - minutes) < Math.abs(a - minutes) ? b : a
    );
    return RING_STYLE[closest] ?? RING_STYLE[60];
  }, []);

  const onEachFeature = useCallback((feature, layer) => {
    const minutes = Math.round((feature.properties?.value ?? 0) / 60);
    layer.bindTooltip(`${minutes} นาที`, { sticky: true });
  }, []);

  const LAYERS = [
    { key: 'schools',   icon: '🏫', label: 'โรงเรียน',  state: showSchools,   toggle: () => setShowSchools(v => !v) },
    { key: 'parks',     icon: '🌳', label: 'สวน',        state: showParks,     toggle: () => setShowParks(v => !v) },
    { key: 'malls',     icon: '🛍️', label: 'ห้าง',       state: showMalls,     toggle: () => setShowMalls(v => !v) },
    { key: 'hospitals', icon: '🏥', label: 'โรงพยาบาล', state: showHospitals, toggle: () => setShowHospitals(v => !v) },
    { key: 'cafes',          icon: '☕', label: 'คาเฟ่',         state: showCafes,          toggle: () => setShowCafes(v => !v) },
    { key: 'suggestedParks', icon: '🌿', label: 'สวนแนะนำ',      state: showSuggestedParks, toggle: () => setShowSuggestedParks(v => !v) },
  ];

  return (
    <div className="relative w-full h-full">

      {/* Map */}
      <MapContainer center={KK_CENTER} zoom={KK_DEFAULT_ZOOM} style={{ width: '100%', height: '100%' }} zoomControl={false}>
        <TileLayer key={basemap} url={BASEMAPS[basemap].url} attribution={BASEMAPS[basemap].attr} />
        {basemap === 'satellite' && (
          <TileLayer key="sat-labels"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            attribution="" />
        )}
        <MapClickHandler onClick={handleMapClick} />
        {flyTarget && <FlyTo latlng={flyTarget} />}
        {userLocation && (
          <Marker position={userLocation} icon={userLocationIcon}
            eventHandlers={{ click: () => runIsochrone(userLocation, 'ตำแหน่งของฉัน') }} />
        )}
        {showSchools   && <SchoolLayer   onSchoolClick={handleSchoolClick} />}
        {showCafes     && <CafeLayer     onCafeClick={handleCafeClick} />}
        {showHospitals && <HospitalLayer onHospitalClick={handleHospitalClick} />}
        {showMalls     && <MallLayer     onMallClick={handleMallClick} />}
        {showParks          && <ParkLayer          onParkClick={handleParkClick} />}
        {showSuggestedParks && <SuggestedParkLayer onParkClick={handleSuggestedParkClick} />}
        {geojson && (
          <GeoJSON
            key={geojsonKey.current}
            data={{ ...geojson, features: [...geojson.features].sort((a, b) => (b.properties?.value ?? 0) - (a.properties?.value ?? 0)) }}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
        {origin && <Marker position={origin} icon={originIcon} />}
      </MapContainer>

      {/* Top control panel */}
      <div className="absolute top-2 left-2 right-2 z-[1000] lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-[440px]">
        <div style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', padding: '10px 12px' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="font-black text-sm leading-tight" style={{ color: '#1e293b' }}>Travel Time Map</div>
              <div className="text-[10px] truncate" style={{ color: '#94a3b8' }}>
                {originName ? `📍 ${originName}` : 'แตะแผนที่หรือ marker เพื่อเลือกจุด'}
              </div>
            </div>
            <button onClick={handleLocateMe} disabled={locating}
              style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: userLocation ? '#dbeafe' : '#f1f5f9', border: userLocation ? '2px solid #3b82f6' : '2px solid transparent', color: userLocation ? '#2563eb' : '#64748b', opacity: locating ? 0.6 : 1, cursor: 'pointer' }}>
              <span style={{ fontSize: 16 }}>{locating ? '⏳' : '📍'}</span>
            </button>
          </div>
          <div className="flex gap-1.5">
            <div className="flex gap-1 flex-1">
              {MODES.map(m => (
                <button key={m.id} onClick={() => { setMode(m.id); setGeojson(null); setError(null); }}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, borderRadius: 12, padding: '6px 2px', background: mode === m.id ? '#3b82f6' : '#f1f5f9', color: mode === m.id ? '#fff' : '#475569', border: 'none', fontSize: 9, fontWeight: mode === m.id ? 700 : 400, cursor: 'pointer' }}>
                  <span style={{ fontSize: 17 }}>{m.icon}</span>{m.label}
                </button>
              ))}
            </div>
            <div style={{ width: 1, background: '#e2e8f0', margin: '2px 0', borderRadius: 1 }} />
            <div className="flex gap-1 flex-1">
              {TIME_OPTIONS.map(t => {
                const active = times.includes(t);
                const s = RING_STYLE[t];
                return (
                  <button key={t} onClick={() => toggleTime(t)}
                    style={{ flex: 1, borderRadius: 10, padding: '6px 2px', background: active ? s.fillColor : '#f1f5f9', color: active ? '#fff' : '#94a3b8', border: active ? `2px solid ${s.color}` : '2px solid transparent', fontSize: 9, fontWeight: active ? 700 : 400, cursor: 'pointer' }}>
                    {t}'
                  </button>
                );
              })}
            </div>
          </div>
          {error && (
            <div style={{ marginTop: 6, fontSize: 10, padding: '5px 10px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}
          {origin && (
            <div style={{ marginTop: 6, fontSize: 9, color: '#94a3b8' }}>
              * ระยะทางประมาณจากความเร็วเฉลี่ย ไม่ใช่เส้นทางถนนจริง
            </div>
          )}
        </div>
      </div>

      {/* Mobile: bottom bar (hidden on desktop) */}
      <div className="absolute left-2 right-2 z-[1000] lg:hidden" style={{ bottom: 'calc(var(--nav-bottom, 52px) + 8px)' }}>
        <div style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(14px)', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.10)', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, flex: 1, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {LAYERS.map(l => (
              <button key={l.key} onClick={l.toggle}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, borderRadius: 12, padding: '6px 8px', flexShrink: 0, background: l.state ? 'rgba(59,130,246,0.10)' : 'transparent', border: l.state ? '1.5px solid #93c5fd' : '1.5px solid transparent', opacity: l.state ? 1 : 0.35, cursor: 'pointer' }}>
                <span style={{ fontSize: 20 }}>{l.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: l.state ? '#2563eb' : '#94a3b8', whiteSpace: 'nowrap' }}>{l.label}</span>
              </button>
            ))}
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: '#e2e8f0', borderRadius: 1 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
            {Object.entries(BASEMAPS).map(([key, bm]) => (
              <button key={key} onClick={() => setBasemap(key)}
                style={{ width: 34, height: 24, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: basemap === key ? '#3b82f6' : '#f1f5f9', border: 'none', fontSize: 14, cursor: 'pointer' }}>
                {bm.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: right side panel (hidden on mobile) */}
      <div className="absolute right-2 z-[1000] hidden lg:flex lg:flex-col" style={{ top: '50%', transform: 'translateY(-50%)', gap: 8 }}>
        <div style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(14px)', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.10)', padding: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {LAYERS.map(l => (
            <button key={l.key} onClick={l.toggle}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, borderRadius: 12, padding: '8px 10px', width: '100%', background: l.state ? 'rgba(59,130,246,0.10)' : 'transparent', border: l.state ? '1.5px solid #93c5fd' : '1.5px solid transparent', opacity: l.state ? 1 : 0.35, cursor: 'pointer' }}>
              <span style={{ fontSize: 22 }}>{l.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: l.state ? '#2563eb' : '#94a3b8', whiteSpace: 'nowrap' }}>{l.label}</span>
            </button>
          ))}
          <div style={{ width: '100%', height: 1, background: '#e2e8f0', borderRadius: 1, margin: '2px 0' }} />
          {Object.entries(BASEMAPS).map(([key, bm]) => (
            <button key={key} onClick={() => setBasemap(key)}
              title={bm.label}
              style={{ width: 38, height: 28, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: basemap === key ? '#3b82f6' : '#f1f5f9', border: 'none', fontSize: 16, cursor: 'pointer' }}>
              {bm.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
