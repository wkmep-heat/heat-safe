import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';

const TYPE_META = {
  flood:    { label: 'น้ำท่วม',     icon: '🌊', color: '#3b82f6' },
  accident: { label: 'อุบัติเหตุ',  icon: '🚨', color: '#ef4444' },
  complain: { label: 'ร้องเรียน',   icon: '📢', color: '#f97316' },
  rain:     { label: 'ฝนตก',        icon: '🌧️', color: '#0ea5e9' },
  weather:  { label: 'สภาพอากาศ',  icon: '⛅', color: '#64748b' },
};
const DEFAULT_META = { label: 'แจ้งเหตุ', icon: '📍', color: '#64748b' };

function reportIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:28px;height:36px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))">
      <svg width="28" height="36" viewBox="0 0 30 38" fill="none">
        <path d="M15 0C6.716 0 0 6.716 0 15C0 25.5 15 38 15 38C15 38 30 25.5 30 15C30 6.716 23.284 0 15 0Z" fill="${color}"/>
        <circle cx="15" cy="15" r="10" fill="white"/>
      </svg>
    </div>`,
    iconSize:    [28, 36],
    iconAnchor:  [14, 36],
    popupAnchor: [0, -38],
  });
}

function fmtDate(ts) {
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('th-TH', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  });
}

export default function ReportPinsLayer() {
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
      {reports.map(r => {
        const meta = TYPE_META[r.type] ?? DEFAULT_META;
        return (
          <Marker key={r.id} position={[r.lat, r.lng]} icon={reportIcon('#ef4444')}>
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
                {r.image && (
                  <img src={r.image} alt="รูปประกอบ"
                    style={{ width: '100%', borderRadius: 8, marginBottom: 6, maxHeight: 120, objectFit: 'cover' }} />
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
