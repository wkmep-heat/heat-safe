import { useState, useEffect, useRef } from 'react';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import Hls from 'hls.js';

const CAMERA_JSON_URL = 'https://traffic.longdo.com/camera.json';

const cameraIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:32px;height:32px;border-radius:50%;
    background:rgba(15,23,42,0.92);
    border:2px solid #38bdf8;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 0 0 3px rgba(56,189,248,0.2),0 2px 10px rgba(0,0,0,0.5);
  ">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M23 7L16 12L23 17V7Z" fill="#38bdf8"/>
      <rect x="1" y="5" width="15" height="14" rx="2" fill="#38bdf8"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

function CameraVideo({ cam }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [status, setStatus] = useState('loading');

  const shortName = cam.title.replace(/^\([^)]+\)\s*/, '');

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !cam.hls_url) { setStatus('error'); return; }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(cam.hls_url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        setStatus('ok');
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setStatus('error');
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = cam.hls_url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => {});
        setStatus('ok');
      }, { once: true });
      video.addEventListener('error', () => setStatus('error'), { once: true });
    } else {
      setStatus('error');
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [cam.hls_url]);

  return (
    <div style={{ fontFamily: 'Noto Sans Thai, Inter, sans-serif', width: '280px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          fontSize: '9px', fontWeight: 700, color: '#fff',
          background: status === 'ok' ? '#ef4444' : '#475569',
          padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase',
        }}>
          {status === 'ok' && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />}
          {status === 'ok' ? 'Live' : status === 'loading' ? '...' : 'Offline'}
        </span>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', margin: 0, flex: 1 }}>{shortName}</p>
      </div>

      <div style={{ borderRadius: '10px', overflow: 'hidden', background: '#0f172a', aspectRatio: '16/9', position: 'relative' }}>
        {status === 'loading' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            <div style={{ width: '24px', height: '24px', border: '2.5px solid #334155', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '11px', color: '#475569' }}>กำลังโหลด...</span>
          </div>
        )}
        {status === 'error' && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M23 7L16 12L23 17V7Z" fill="#334155"/>
              <rect x="1" y="5" width="15" height="14" rx="2" fill="#334155"/>
              <line x1="3" y1="3" x2="21" y2="21" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: '11px', color: '#475569' }}>ไม่มีสัญญาณภาพ</span>
          </div>
        )}
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8' }}>📡 {cam.organization}</span>
        <a
          href={`https://traffic.longdo.com/c/${cam.camid}`}
          target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '11px', color: '#0ea5e9', fontWeight: 600, textDecoration: 'none' }}
        >
          ดูเต็มจอ →
        </a>
      </div>
    </div>
  );
}

export default function CCTVLayer() {
  const [cameras, setCameras] = useState([]);
  const [mapBounds, setMapBounds] = useState(null);

  const map = useMap();
  useMapEvents({
    moveend(e) { setMapBounds(e.target.getBounds()); },
  });

  useEffect(() => {
    setMapBounds(map.getBounds());
  }, [map]);

  useEffect(() => {
    fetch(CAMERA_JSON_URL)
      .then(r => r.json())
      .then(d => setCameras(d.item ?? []))
      .catch(() => {});
  }, []);

  const visible = mapBounds
    ? cameras.filter(cam => {
        const lat = parseFloat(cam.latitude);
        const lon = parseFloat(cam.longitude);
        return !isNaN(lat) && !isNaN(lon) && mapBounds.contains([lat, lon]);
      })
    : [];

  return visible.map(cam => (
    <Marker
      key={cam.camid}
      position={[parseFloat(cam.latitude), parseFloat(cam.longitude)]}
      icon={cameraIcon}
    >
      <Popup maxWidth={300} autoPan={false} className="cctv-popup">
        <CameraVideo cam={cam} />
      </Popup>
    </Marker>
  ));
}
