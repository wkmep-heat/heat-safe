import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useOldBuildings } from '../../hooks/useOldBuildings';

const BASE_FILL = 0.30;

export default function OldBuildingLayer({ opacity = 0.80 }) {
  const map      = useMap();
  const layerRef = useRef(null);
  const { geojson, status, progress } = useOldBuildings();

  useEffect(() => {
    if (!geojson) return;
    const renderer = L.canvas({ padding: 0.5 });
    layerRef.current = L.geoJSON(geojson, {
      renderer,
      style: {
        color:       '#f59e0b',
        weight:      1,
        opacity,
        fillColor:   '#fde68a',
        fillOpacity: BASE_FILL * opacity,
      },
    }).addTo(map);
    return () => {
      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
    };
  }, [map, geojson]);

  useEffect(() => {
    layerRef.current?.setStyle({ opacity, fillOpacity: BASE_FILL * opacity });
  }, [opacity]);

  if (status === 'loading') {
    const pct = Math.round((progress ?? 0) * 100);
    return (
      <div style={{
        position:'absolute', top:70, right:12, zIndex:1000,
        background:'rgba(15,23,42,0.92)', color:'#93c5fd',
        fontSize:11, padding:'8px 12px', borderRadius:10,
        pointerEvents:'none', minWidth:190,
        boxShadow:'0 4px 16px rgba(0,0,0,0.35)',
      }}>
        <div style={{ marginBottom:5 }}>กำลังโหลดอาคาร Old_Cellsize03… {pct}%</div>
        <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.15)' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:'#3b82f6', borderRadius:2, transition:'width 0.3s' }} />
        </div>
        <div style={{ marginTop:4, color:'#64748b', fontSize:10 }}>โหลดครั้งเดียว · cache 30 วัน</div>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div style={{ position:'absolute',top:70,right:12,zIndex:1000, background:'rgba(15,23,42,0.92)', color:'#ef4444', fontSize:11, padding:'6px 12px', borderRadius:8, pointerEvents:'none' }}>
        โหลดข้อมูลไม่สำเร็จ
      </div>
    );
  }
  return null;
}
