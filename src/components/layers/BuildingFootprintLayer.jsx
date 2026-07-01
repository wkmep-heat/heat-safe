import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMSBuildingFootprints } from '../../hooks/useMSBuildingFootprints';

const BASE_FILL_OPACITY = 0.28;

export default function BuildingFootprintLayer({ opacity = 0.75 }) {
  const map      = useMap();
  const layerRef = useRef(null);
  const { geojson, count, status, progress } = useMSBuildingFootprints();

  useEffect(() => {
    if (!geojson) return;

    const renderer = L.canvas({ padding: 0.5 });
    layerRef.current = L.geoJSON(geojson, {
      renderer,
      style: {
        color:       '#f59e0b',
        weight:      1,
        opacity,
        fillColor:   '#fcd34d',
        fillOpacity: BASE_FILL_OPACITY * opacity,
      },
      onEachFeature: (feature, layer) => {
        const h = feature.properties?.height;
        const label = h ? `อาคาร · สูง ${h.toFixed(1)} ม.` : 'อาคาร';
        layer.bindPopup(
          `<div style="font-family:'Noto Sans Thai',sans-serif;font-size:12px">${label}</div>`,
          { maxWidth: 180 }
        );
      },
    }).addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, geojson]);

  useEffect(() => {
    if (!layerRef.current) return;
    layerRef.current.setStyle({ opacity, fillOpacity: BASE_FILL_OPACITY * opacity });
  }, [opacity]);

  if (status === 'loading') {
    const pct = Math.round((progress ?? 0) * 100);
    return (
      <div style={{
        position: 'absolute', top: 70, right: 12, zIndex: 1000,
        background: 'rgba(15,23,42,0.92)', color: '#f59e0b',
        fontSize: 11, padding: '8px 12px', borderRadius: 10,
        pointerEvents: 'none', minWidth: 190,
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
      }}>
        <div style={{ marginBottom: 5 }}>
          กำลังโหลดข้อมูลอาคาร ML… {pct}%
        </div>
        <div style={{
          height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.15)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: '#f59e0b',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>
        <div style={{ marginTop: 4, color: '#94a3b8', fontSize: 10 }}>
          Microsoft ML Building Footprints · โหลดครั้งเดียว
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{
        position: 'absolute', top: 70, right: 12, zIndex: 1000,
        background: 'rgba(15,23,42,0.92)', color: '#ef4444',
        fontSize: 11, padding: '6px 12px', borderRadius: 8,
        pointerEvents: 'none',
      }}>
        โหลดข้อมูลอาคารไม่สำเร็จ (CORS/Network)
      </div>
    );
  }

  return null;
}
