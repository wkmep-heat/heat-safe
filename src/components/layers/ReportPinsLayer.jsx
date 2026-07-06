import { useEffect, useState, useRef } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';

const TYPE_META = {
  heat:     { label: 'ความร้อน',    icon: '🔥', color: '#dc2626' },
  pm25:     { label: 'ฝุ่น PM2.5',  icon: '😷', color: '#a855f7' },
  rain:     { label: 'ฝนตก',        icon: '🌧️', color: '#0ea5e9' },
  flood:    { label: 'น้ำท่วม',     icon: '🌊', color: '#3b82f6' },
  accident: { label: 'อุบัติเหตุ',  icon: '🚨', color: '#ef4444' },
  other:    { label: 'อื่นๆ',       icon: '📢', color: '#64748b' },
};
const DEFAULT_META = { label: 'แจ้งเหตุ', icon: '📍', color: '#64748b' };

/* หมุดที่แจ้งเข้ามาตั้งแต่จุดนี้เป็นต้นไปจะแยกสีตามหมวดหมู่ ส่วนหมุดเก่าก่อนหน้ายังคงเป็นสีแดงเหมือนเดิม */
const CATEGORY_STYLE_CUTOFF = new Date('2026-07-06T00:00:00+07:00').getTime();

function isNewReport(r) {
  const ts = r.createdAt?.toDate ? r.createdAt.toDate().getTime() : (r.createdAt ? new Date(r.createdAt).getTime() : 0);
  return ts >= CATEGORY_STYLE_CUTOFF;
}

const TYPE_INTENSITY = {
  heat:     1.00,
  accident: 1.00,
  flood:    0.90,
  pm25:     0.80,
  rain:     0.70,
  other:    0.60,
};

function ReportHeatOverlay({ reports }) {
  const map = useMap();
  const heatRef = useRef(null);

  useEffect(() => {
    if (!L.heatLayer) return;
    heatRef.current = L.heatLayer([], {
      radius:     22,
      blur:       15,
      maxZoom:    17,
      max:        1.0,
      minOpacity: 0.45,
      gradient: {
        0.0:  '#fef9c3',
        0.3:  '#fde68a',
        0.55: '#fb923c',
        0.75: '#ef4444',
        1.0:  '#7f1d1d',
      },
    }).addTo(map);
    return () => {
      if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null; }
    };
  }, [map]);

  useEffect(() => {
    if (!heatRef.current) return;
    const points = reports.map(r => [r.lat, r.lng, TYPE_INTENSITY[r.type] ?? 0.75]);
    heatRef.current.setLatLngs(points);
  }, [reports]);

  return null;
}

function reportIcon(color, size = 10) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:1.5px solid #fff;
      box-shadow:0 1px 3px rgba(0,0,0,0.45);
    "></div>`,
    iconSize:    [size, size],
    iconAnchor:  [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

function fmtDate(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('th-TH', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  });
}

export default function ReportPinsLayer({ showHeatmap = true, showPins = true }) {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setReports(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(r => r.lat && r.lng)
      );
    });
    return unsub;
  }, []);

  return (
    <>
      {showHeatmap && <ReportHeatOverlay reports={reports} />}
      {showPins && reports.map(r => {
        const meta = TYPE_META[r.type] ?? DEFAULT_META;
        const pinColor = isNewReport(r) ? meta.color : '#ef4444';
        return (
          <Marker key={r.id} position={[r.lat, r.lng]} icon={reportIcon(pinColor)}>
            <Popup autoPan={false} closeButton className="temp-point-popup">
              <div style={{ fontFamily: 'Noto Sans Thai, Inter, sans-serif', minWidth: '180px', maxWidth: '220px', padding: '2px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 16 }}>{meta.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: meta.color }}>{meta.label}</span>
                </div>
                {r.address && (
                  <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>📍 {r.address}</div>
                )}
                {r.detail && (
                  <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.5, marginBottom: 6 }}>{r.detail}</div>
                )}
                <div style={{ fontSize: 9, color: '#cbd5e1' }}>{fmtDate(r.createdAt)}</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
