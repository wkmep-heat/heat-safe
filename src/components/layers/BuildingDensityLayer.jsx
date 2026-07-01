import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { useOSMBuildings } from '../../hooks/useOSMBuildings';

export default function BuildingDensityLayer({ opacity = 0.75 }) {
  const map      = useMap();
  const layerRef = useRef(null);
  const { points, status } = useOSMBuildings();

  useEffect(() => {
    if (!L.heatLayer || !points?.length) return;

    layerRef.current = L.heatLayer(points, {
      radius:     18,
      blur:       12,
      maxZoom:    17,
      max:        1.0,
      minOpacity: 0.25,
      gradient: {
        0.00: '#ffffcc',
        0.25: '#fd8d3c',
        0.55: '#e31a1c',
        0.80: '#800026',
        1.00: '#400010',
      },
    }).addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, points]);

  useEffect(() => {
    layerRef.current?.setOptions?.({ opacity });
  }, [opacity]);

  // แสดง badge สถานะขณะโหลด
  if (status === 'loading') {
    return (
      <div
        style={{
          position: 'absolute', top: 70, right: 12,
          zIndex: 1000,
          background: 'rgba(15,23,42,0.88)',
          color: '#f59e0b',
          fontSize: 11,
          padding: '5px 10px',
          borderRadius: 8,
          pointerEvents: 'none',
        }}
      >
        กำลังโหลดข้อมูลอาคาร OSM...
      </div>
    );
  }

  return null;
}
