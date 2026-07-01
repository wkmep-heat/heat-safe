import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { HOTSPOT_POINTS, getHotspotColor } from '../../data/hotspotData';

function makeIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:28px;height:36px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))">
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
        <path d="M14 0C6.268 0 0 6.268 0 14C0 24 14 36 14 36C14 36 28 24 28 14C28 6.268 21.732 0 14 0Z" fill="${color}"/>
        <circle cx="14" cy="14" r="6" fill="rgba(255,255,255,0.9)"/>
        <circle cx="14" cy="14" r="3" fill="${color}"/>
      </svg>
    </div>`,
    iconSize:    [28, 36],
    iconAnchor:  [14, 36],
    popupAnchor: [0, -40],
  });
}

export default function HotspotLayer({ opacity = 0.9 }) {
  return (
    <>
      {HOTSPOT_POINTS.map(pt => {
        const color = getHotspotColor(pt.score);
        const icon  = makeIcon(color);
        return (
          <Marker key={pt.id} position={[pt.lat, pt.lng]} icon={icon} opacity={opacity}>
            <Popup autoPan={false} closeButton className="temp-point-popup">
              <div style={{ fontFamily: 'Noto Sans Thai, Inter, sans-serif', minWidth: '180px', padding: '2px 0' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>{pt.id}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '4px', lineHeight: 1.3 }}>
                  {pt.name}
                </div>
                <div style={{
                  display: 'inline-block',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: `${color}20`,
                  color,
                  marginBottom: '6px',
                }}>
                  {pt.level}
                </div>
                <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>{pt.reason}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>{pt.type}</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
