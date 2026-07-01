import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { COMMERCIAL_POINTS } from '../../data/commercialData';

const DENSITY_INTENSITY = {
  'สูงมาก':      1.00,
  'สูง':         0.80,
  'ปานกลาง-สูง': 0.65,
  'ปานกลาง':     0.50,
};

function HeatLayer({ points, opacity }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!L.heatLayer || !points.length) return;
    layerRef.current = L.heatLayer(points, {
      radius: 50,
      blur: 20,
      maxZoom: 17,
      max: 1.0,
      minOpacity: 0.65,
      gradient: {
        0.0:  '#2c7bb6',
        0.25: '#1a9aa8',
        0.45: '#74c476',
        0.60: '#f6c945',
        0.78: '#f08a24',
        1.0:  '#d7191c',
      },
    }).addTo(map);
    return () => {
      if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
    };
  }, [map, points]);

  useEffect(() => {
    layerRef.current?.setOptions?.({ opacity: opacity ?? 0.75 });
  }, [opacity]);

  return null;
}

export default function HeatAccumulationLayer({ districts, opacity = 1 }) {
  const heatPoints = [
    ...districts.map(d => [d.lat, d.lng, d.heatValue]),
    ...COMMERCIAL_POINTS.map(p => [p.lat, p.lng, DENSITY_INTENSITY[p.density] ?? 0.5]),
  ];

  return <HeatLayer points={heatPoints} opacity={opacity} />;
}
