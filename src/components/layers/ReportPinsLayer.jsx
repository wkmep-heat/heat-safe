import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';

const TYPE_INTENSITY = {
  flood:    1.00,
  accident: 1.00,
  complain: 0.70,
  rain:     0.80,
  weather:  0.60,
};

export default function ReportPinsLayer() {
  const map = useMap();
  const heatRef = useRef(null);

  useEffect(() => {
    if (!L.heatLayer) return;

    heatRef.current = L.heatLayer([], {
      radius:     45,
      blur:       30,
      maxZoom:    17,
      max:        1.0,
      minOpacity: 0.55,
      gradient: {
        0.0:  '#fef9c3',
        0.3:  '#fde68a',
        0.55: '#fb923c',
        0.75: '#ef4444',
        1.0:  '#7f1d1d',
      },
    }).addTo(map);

    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const points = snap.docs
        .map(d => {
          const { lat, lng, type } = d.data();
          if (!lat || !lng) return null;
          return [lat, lng, TYPE_INTENSITY[type] ?? 0.75];
        })
        .filter(Boolean);
      heatRef.current?.setLatLngs(points);
    });

    return () => {
      unsub();
      if (heatRef.current) { map.removeLayer(heatRef.current); heatRef.current = null; }
    };
  }, [map]);

  return null;
}
