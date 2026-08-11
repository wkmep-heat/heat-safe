import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// สีตามระดับความเสี่ยง (0 ปกติ → 3 วิกฤต/ล้นตลิ่ง) ให้ตรงกับ HomeView
const RISK_COLOR = ['#16a34a', '#ca8a04', '#ea580c', '#dc2626'];
const SITUATION_LABEL = {
  1: 'น้ำน้อยวิกฤต', 2: 'น้ำน้อย', 3: 'ปกติ', 4: 'น้ำมาก', 5: 'น้ำมากวิกฤต',
};

function waterDivIcon(color, pulse) {
  const size = 22;
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${size}px;height:${size}px">
      ${pulse ? `<span style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.55;animation:livePulse 1.6s ease-in-out infinite"></span>` : ''}
      <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M12 2s7 8.5 7 13a7 7 0 1 1-14 0c0-4.5 7-13 7-13z"/></svg>
      </div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export default function WaterLevelLayer({ stations = [] }) {
  return (
    <>
      {stations.filter(s => s.lat && s.lng).map(s => {
        const color = RISK_COLOR[s.riskLevel] ?? RISK_COLOR[0];
        return (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={waterDivIcon(color, s.riskLevel >= 2)}
          >
            <Popup autoPan={false} closeButton>
              <div style={{ fontFamily: 'Noto Sans Thai, Inter, sans-serif', minWidth: '190px', padding: '2px 0' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
                  🌊 {s.river ?? s.amphoe ?? 'สถานีวัดระดับน้ำ'}{s.code ? ` · ${s.code}` : ''}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', lineHeight: 1.3 }}>{s.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '6px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 900, color }}>
                    {s.waterLevelMsl != null ? s.waterLevelMsl.toFixed(2) : '--'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>ม.รทก. (MSL)</span>
                </div>
                <span style={{
                  display: 'inline-block', marginTop: '6px', fontSize: '11px', fontWeight: 700,
                  color, background: `${color}18`, border: `1px solid ${color}40`,
                  borderRadius: '999px', padding: '2px 9px',
                }}>
                  {SITUATION_LABEL[s.situationLevel] ?? '—'}
                </span>
                {s.diffBankText && (
                  <div style={{ fontSize: '11px', color: s.isOverBank ? '#dc2626' : '#475569', marginTop: '6px', fontWeight: s.isOverBank ? 700 : 400 }}>
                    {s.isOverBank ? '🔴 ' : ''}{s.diffBankText} {s.diffBank != null ? `${s.diffBank} ม.` : ''}
                  </div>
                )}
                {s.datetime && (
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>
                    อัปเดต {s.datetime} · {s.agency ?? 'สสน./ชป.'}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
